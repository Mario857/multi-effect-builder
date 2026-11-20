import type { EffectDefinition, EffectParameterValue } from '@/types/audio';
import { smoothParam } from '@/lib/audio/paramUtils';
import { SILENT_GAIN, UNITY_GAIN } from '@/lib/constants/dsp';

/**
 * Base class for all audio effect nodes.
 * Wraps Web Audio API nodes with bypass, dry/wet mix, and change-detected,
 * click-free parameter control.
 *
 * Internal routing — bypass and mix use separate gain stages so that neither
 * can ever overwrite the other:
 *
 *   input ─→ bypass ────────────────────────────→ output
 *   input ─→ [processing] ─→ wet ─┬─→ effectBus ─→ output
 *   input ─→ dry ─────────────────┘
 */
export abstract class EffectNode {
  protected readonly context: AudioContext;
  protected readonly inputNode: GainNode;
  protected readonly outputNode: GainNode;
  /** End of the processing chain — subclasses connect their last node here. */
  protected readonly wetNode: GainNode;
  private readonly dryNode: GainNode;
  private readonly effectBusNode: GainNode;
  private readonly bypassNode: GainNode;
  /** Last value applied per parameter id — lets unchanged updates be skipped. */
  private readonly appliedValues: Map<string, number>;
  private readonly createdAt: number;
  private _isBypassed: boolean;

  constructor(context: AudioContext) {
    this.context = context;
    this.inputNode = context.createGain();
    this.outputNode = context.createGain();
    this.bypassNode = context.createGain();
    this.effectBusNode = context.createGain();
    this.wetNode = context.createGain();
    this.dryNode = context.createGain();
    this.appliedValues = new Map();
    this.createdAt = context.currentTime;
    this._isBypassed = false;

    // Start active and fully wet. Gains are set directly, not ramped — a new
    // node must not leak dry signal while a fade-in runs.
    this.bypassNode.gain.value = SILENT_GAIN;
    this.effectBusNode.gain.value = UNITY_GAIN;
    this.wetNode.gain.value = UNITY_GAIN;
    this.dryNode.gain.value = SILENT_GAIN;

    // Bypass path: input → bypass → output
    this.inputNode.connect(this.bypassNode);
    this.bypassNode.connect(this.outputNode);

    // Wet path: input → [processing] → wet → effectBus → output
    this.wetNode.connect(this.effectBusNode);
    this.effectBusNode.connect(this.outputNode);

    // Dry path (only audible when a subclass lowers the mix): input → dry → effectBus
    this.inputNode.connect(this.dryNode);
    this.dryNode.connect(this.effectBusNode);
  }

  get input(): GainNode {
    return this.inputNode;
  }

  get output(): GainNode {
    return this.outputNode;
  }

  get isBypassed(): boolean {
    return this._isBypassed;
  }

  set isBypassed(value: boolean) {
    if (value === this._isBypassed) return;
    this._isBypassed = value;

    const bypassGain = value ? UNITY_GAIN : SILENT_GAIN;
    this.setParam(this.bypassNode.gain, bypassGain);
    this.setParam(this.effectBusNode.gain, UNITY_GAIN - bypassGain);
  }

  /**
   * Sets one parameter. Callers re-send whole parameter lists on every store
   * update, so values that did not change are skipped here — nothing is
   * rescheduled, rebuilt, or made audible for them.
   */
  setParameter(id: string, value: number): void {
    // Parameter values originate from persisted presets — never hand NaN/Infinity to an AudioParam
    if (!Number.isFinite(value)) return;
    if (this.appliedValues.get(id) === value) return;

    this.appliedValues.set(id, value);
    this.applyParameter(id, value);
  }

  setParameters(parameters: readonly EffectParameterValue[]): void {
    for (const param of parameters) {
      this.setParameter(param.id, param.value);
    }
  }

  abstract dispose(): void;

  /** Applies a parameter value that is known to have changed. */
  protected abstract applyParameter(id: string, value: number): void;

  /**
   * Initialises every parameter from the effect's definition, so the defaults
   * live in one place and re-sending them later is a no-op.
   * Call at the end of the subclass constructor, once its nodes exist.
   */
  protected applyDefaults(definition: EffectDefinition): void {
    for (const param of definition.parameters) {
      this.setParameter(param.id, param.defaultValue);
    }
  }

  /** Moves an AudioParam to a new value — the single way effects change params. */
  protected setParam(param: AudioParam, value: number): void {
    const now = this.context.currentTime;

    // Until the context clock moves past the construction instant this node has
    // not rendered a single block, so there is no audible state to glide from —
    // start exactly at the requested value (e.g. a node created bypassed must
    // not fade its wet signal out).
    if (now === this.createdAt) {
      param.value = value;
      return;
    }

    smoothParam(param, value, now);
  }

  /**
   * Sets the dry/wet balance of the effect path (0 = dry only, 1 = wet only).
   * Independent of bypass, which fades the whole effect path against the bypass path.
   */
  protected setMix(mix: number): void {
    this.setParam(this.wetNode.gain, mix);
    this.setParam(this.dryNode.gain, UNITY_GAIN - mix);
  }

  protected disposeBase(): void {
    this.inputNode.disconnect();
    this.outputNode.disconnect();
    this.bypassNode.disconnect();
    this.effectBusNode.disconnect();
    this.wetNode.disconnect();
    this.dryNode.disconnect();
  }
}
