import type {
  AmpType,
  EffectInstance,
  EffectParameterValue,
  PedalboardSignalPath,
} from '@/types/audio';
import type { EffectNode } from '@/lib/audio/effectNode';
import type { SignalChain } from '@/lib/audio/signalChain';
import { createEffectNode } from '@/lib/audio/effectFactory';

interface AmpEntry {
  readonly type: AmpType;
  readonly parameters: readonly EffectParameterValue[];
  readonly node: EffectNode;
}

interface EffectEntry {
  // The store's effect object this node currently reflects
  readonly effect: EffectInstance;
  readonly node: EffectNode;
}

/**
 * Sends only the parameters whose value differs from what the node already has.
 * Some parameters are expensive to set (the reverb rebuilds its impulse response),
 * so re-sending a whole list because one knob moved causes audible glitches.
 */
function pushChangedParameters(
  node: EffectNode,
  previous: readonly EffectParameterValue[],
  next: readonly EffectParameterValue[],
): void {
  if (previous === next) return;

  next.forEach((parameter, index) => {
    // Parameter lists keep their definition order, so the same knob sits at the same index
    const prior = previous[index];
    const isUnchanged = prior?.id === parameter.id && prior.value === parameter.value;
    if (!isUnchanged) node.setParameter(parameter.id, parameter.value);
  });
}

/**
 * Keeps the Web Audio graph in step with the pedalboard state by keyed
 * reconciliation, outside the React render cycle: effect nodes are matched to
 * pedalboard effects by id, so a state change only touches what actually changed.
 *
 * - new effect id → node created; removed id → node disposed
 * - reorder → existing nodes are rewired, never recreated
 * - bypass → set in place on the existing node
 * - parameters → only changed values are sent, only to the affected node
 * - amp → recreated only when the amp type changes
 *
 * The store updates immutably, so comparing object references is enough to
 * detect what changed.
 */
export class PedalboardGraphSync {
  private readonly context: AudioContext;
  private readonly chain: SignalChain;
  private amp: AmpEntry | null;
  private effects: Map<string, EffectEntry>;
  // The `effects` array the graph currently reflects — lets unrelated store updates exit early
  private appliedEffects: readonly EffectInstance[] | null;

  /**
   * @param context - Context to create effect nodes in (worklet modules and cab IRs must be loaded)
   * @param chain - The chain the amp and effect nodes are wired into
   */
  constructor(context: AudioContext, chain: SignalChain) {
    this.context = context;
    this.chain = chain;
    this.amp = null;
    this.effects = new Map();
    this.appliedEffects = null;
  }

  /**
   * Brings the audio graph in line with the given amp and effect chain.
   * Cheap to call on every store update — it returns immediately when nothing relevant changed.
   * @param signalPath - The desired amp and ordered effect chain
   */
  sync({ ampType, ampParameters, effects }: PedalboardSignalPath): void {
    const previousAmp = this.amp;
    const previousEffects = this.effects;

    const isAmpUnchanged = previousAmp?.type === ampType && previousAmp.parameters === ampParameters;
    if (isAmpUnchanged && this.appliedEffects === effects) return;

    const amp = this.reconcileAmp(ampType, ampParameters);
    const nextEffects = this.reconcileEffects(effects);

    this.chain.setNodes([amp.node, ...Array.from(nextEffects.values(), (entry) => entry.node)]);

    // Dispose replaced nodes only after the chain has been rewired around them
    if (previousAmp !== null && previousAmp.node !== amp.node) previousAmp.node.dispose();
    for (const [id, entry] of previousEffects) {
      if (nextEffects.get(id)?.node !== entry.node) entry.node.dispose();
    }

    this.amp = amp;
    this.effects = nextEffects;
    this.appliedEffects = effects;
  }

  /** Removes every node from the chain and releases it. */
  dispose(): void {
    this.chain.setNodes([]);
    this.amp?.node.dispose();
    for (const entry of this.effects.values()) {
      entry.node.dispose();
    }
    this.amp = null;
    this.effects = new Map();
    this.appliedEffects = null;
  }

  private reconcileAmp(type: AmpType, parameters: readonly EffectParameterValue[]): AmpEntry {
    const current = this.amp;

    // Amp models differ in their internal structure, so a new type needs a new node
    if (current === null || current.type !== type) {
      const node = createEffectNode(this.context, type);
      node.setParameters(parameters);
      return { type, parameters, node };
    }

    pushChangedParameters(current.node, current.parameters, parameters);
    return { type, parameters, node: current.node };
  }

  private reconcileEffects(effects: readonly EffectInstance[]): Map<string, EffectEntry> {
    // Map iteration follows insertion order, so this map also carries the chain order
    const nextEffects = new Map<string, EffectEntry>();

    for (const effect of effects) {
      const current = this.effects.get(effect.id);
      nextEffects.set(effect.id, {
        effect,
        node: this.reconcileEffectNode(current, effect),
      });
    }
    return nextEffects;
  }

  private reconcileEffectNode(current: EffectEntry | undefined, effect: EffectInstance): EffectNode {
    // An id that reappears with a different type (e.g. edited storage) is a different effect
    if (current === undefined || current.effect.type !== effect.type) {
      const node = createEffectNode(this.context, effect.type);
      node.setParameters(effect.parameters);
      if (effect.isBypassed) node.isBypassed = true;
      return node;
    }

    const { node } = current;
    if (current.effect.isBypassed !== effect.isBypassed) node.isBypassed = effect.isBypassed;
    pushChangedParameters(node, current.effect.parameters, effect.parameters);
    return node;
  }
}
