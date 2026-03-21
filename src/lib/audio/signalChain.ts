import { EffectNode } from '@/lib/audio/effectNode';

/**
 * Manages a chain of EffectNodes connected in series.
 * Input → [Effect1] → [Effect2] → ... → Output
 */
export class SignalChain {
  private context: AudioContext;
  private nodes: EffectNode[];
  private inputNode: GainNode;
  private outputNode: GainNode;

  constructor(context: AudioContext) {
    this.context = context;
    this.nodes = [];
    this.inputNode = context.createGain();
    this.outputNode = context.createGain();

    // Direct connection when chain is empty
    this.inputNode.connect(this.outputNode);
  }

  get input(): GainNode {
    return this.inputNode;
  }

  get output(): GainNode {
    return this.outputNode;
  }

  get length(): number {
    return this.nodes.length;
  }

  private reconnect(): void {
    // Disconnect everything from input
    this.inputNode.disconnect();

    if (this.nodes.length === 0) {
      this.inputNode.connect(this.outputNode);
      return;
    }

    // Connect: input → first node
    this.inputNode.connect(this.nodes[0].input);

    // Connect each node to the next
    for (let i = 0; i < this.nodes.length - 1; i++) {
      this.nodes[i].output.disconnect();
      this.nodes[i].output.connect(this.nodes[i + 1].input);
    }

    // Connect: last node → output
    const lastNode = this.nodes[this.nodes.length - 1];
    lastNode.output.disconnect();
    lastNode.output.connect(this.outputNode);
  }

  addNode(node: EffectNode): void {
    this.nodes.push(node);
    this.reconnect();
  }

  insertNode(node: EffectNode, index: number): void {
    const clampedIndex = Math.min(Math.max(0, index), this.nodes.length);
    this.nodes.splice(clampedIndex, 0, node);
    this.reconnect();
  }

  removeNode(index: number): EffectNode | undefined {
    if (index < 0 || index >= this.nodes.length) return undefined;
    const removed = this.nodes.splice(index, 1)[0];
    removed.output.disconnect();
    this.reconnect();
    return removed;
  }

  moveNode(fromIndex: number, toIndex: number): void {
    if (fromIndex < 0 || fromIndex >= this.nodes.length) return;
    if (toIndex < 0 || toIndex >= this.nodes.length) return;
    if (fromIndex === toIndex) return;

    const [node] = this.nodes.splice(fromIndex, 1);
    this.nodes.splice(toIndex, 0, node);
    this.reconnect();
  }

  getNode(index: number): EffectNode | undefined {
    return this.nodes[index];
  }

  clear(): void {
    for (const node of this.nodes) {
      node.output.disconnect();
      node.dispose();
    }
    this.nodes = [];
    this.reconnect();
  }

  dispose(): void {
    this.clear();
    this.inputNode.disconnect();
    this.outputNode.disconnect();
  }
}
