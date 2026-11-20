import { EffectNode } from '@/lib/audio/effectNode';
import { COMPRESSOR_DEFINITION } from '@/lib/constants/effects';

/**
 * Dynamic range compressor built on the native DynamicsCompressorNode.
 */
export class CompressorEffect extends EffectNode {
  private compressorNode: DynamicsCompressorNode;

  constructor(context: AudioContext) {
    super(context);

    this.compressorNode = context.createDynamicsCompressor();

    // Wet path: input → compressor → wetNode
    this.inputNode.connect(this.compressorNode);
    this.compressorNode.connect(this.wetNode);

    this.applyDefaults(COMPRESSOR_DEFINITION);
  }

  protected applyParameter(id: string, value: number): void {
    switch (id) {
      case 'threshold':
        this.setParam(this.compressorNode.threshold, value);
        break;
      case 'ratio':
        this.setParam(this.compressorNode.ratio, value);
        break;
      case 'attack':
        this.setParam(this.compressorNode.attack, value);
        break;
      case 'release':
        this.setParam(this.compressorNode.release, value);
        break;
      case 'knee':
        this.setParam(this.compressorNode.knee, value);
        break;
    }
  }

  dispose(): void {
    this.compressorNode.disconnect();
    this.disposeBase();
  }
}
