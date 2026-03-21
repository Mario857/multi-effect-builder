import { EffectNode } from '@/lib/audio/effectNode';

const PARAM_RAMP_TIME = 0.02;

export class CompressorEffect extends EffectNode {
  private compressorNode: DynamicsCompressorNode;

  constructor(context: AudioContext) {
    super(context);

    this.compressorNode = context.createDynamicsCompressor();
    this.compressorNode.threshold.value = -24;
    this.compressorNode.ratio.value = 4;
    this.compressorNode.attack.value = 0.003;
    this.compressorNode.release.value = 0.25;
    this.compressorNode.knee.value = 8;

    // Wet path: input → compressor → wetNode
    this.inputNode.connect(this.compressorNode);
    this.compressorNode.connect(this.wetNode);
  }

  setParameter(id: string, value: number): void {
    const now = this.context.currentTime;
    switch (id) {
      case 'threshold':
        this.compressorNode.threshold.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        break;
      case 'ratio':
        this.compressorNode.ratio.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        break;
      case 'attack':
        this.compressorNode.attack.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        break;
      case 'release':
        this.compressorNode.release.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        break;
      case 'knee':
        this.compressorNode.knee.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        break;
    }
  }

  dispose(): void {
    this.compressorNode.disconnect();
    this.disposeBase();
  }
}
