import type { EffectNode } from '@/lib/audio/effectNode';

/**
 * Wires a list of EffectNodes in series.
 * Input → [Effect1] → [Effect2] → ... → Output
 *
 * The chain only owns the wiring: whoever creates the effect nodes is
 * responsible for disposing them once they are no longer in the chain.
 */
export class SignalChain {
  private readonly inputNode: GainNode;
  private readonly outputNode: GainNode;
  // Current wiring — maps every source node to the node it feeds
  private links: Map<AudioNode, AudioNode>;

  constructor(context: AudioContext) {
    this.inputNode = context.createGain();
    this.outputNode = context.createGain();
    this.links = new Map();

    // Direct connection when chain is empty
    this.setNodes([]);
  }

  get input(): GainNode {
    return this.inputNode;
  }

  get output(): GainNode {
    return this.outputNode;
  }

  /**
   * Makes the chain consist of exactly these nodes, in this order.
   * Only links that differ from the current wiring are touched, so adding,
   * removing or moving one effect leaves the rest of the chain (and any
   * delay/reverb tails ringing inside it) connected and running.
   * @param nodes - The effect nodes in signal-flow order
   */
  setNodes(nodes: readonly EffectNode[]): void {
    const nextLinks = new Map<AudioNode, AudioNode>();
    let source: AudioNode = this.inputNode;
    for (const node of nodes) {
      nextLinks.set(source, node.input);
      source = node.output;
    }
    nextLinks.set(source, this.outputNode);

    // Every source feeds exactly one node, so a bare disconnect() removes just that link.
    // (It also cannot throw if the node was already disposed, unlike disconnect(destination).)
    for (const [from, to] of this.links) {
      if (nextLinks.get(from) !== to) from.disconnect();
    }
    for (const [from, to] of nextLinks) {
      if (this.links.get(from) !== to) from.connect(to);
    }
    this.links = nextLinks;
  }

  /** Disconnects the chain's own wiring. Does not dispose the effect nodes. */
  dispose(): void {
    for (const from of this.links.keys()) {
      from.disconnect();
    }
    this.links.clear();
    this.outputNode.disconnect();
  }
}
