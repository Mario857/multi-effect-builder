import { EffectNode } from '@/lib/audio/effectNode';

const PARAM_RAMP_TIME = 0.02;
const DEFAULT_Q = 1.5;

export class EqualizerEffect extends EffectNode {
  private lowFilter: BiquadFilterNode;
  private midFilter: BiquadFilterNode;
  private highFilter: BiquadFilterNode;

  constructor(context: AudioContext) {
    super(context);

    this.lowFilter = context.createBiquadFilter();
    this.lowFilter.type = 'lowshelf';
    this.lowFilter.frequency.value = 200;
    this.lowFilter.gain.value = 0;

    this.midFilter = context.createBiquadFilter();
    this.midFilter.type = 'peaking';
    this.midFilter.frequency.value = 1000;
    this.midFilter.Q.value = DEFAULT_Q;
    this.midFilter.gain.value = 0;

    this.highFilter = context.createBiquadFilter();
    this.highFilter.type = 'highshelf';
    this.highFilter.frequency.value = 5000;
    this.highFilter.gain.value = 0;

    // Wet path: input → low → mid → high → wetNode
    this.inputNode.connect(this.lowFilter);
    this.lowFilter.connect(this.midFilter);
    this.midFilter.connect(this.highFilter);
    this.highFilter.connect(this.wetNode);
  }

  setParameter(id: string, value: number): void {
    const now = this.context.currentTime;
    switch (id) {
      case 'lowGain':
        this.lowFilter.gain.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        break;
      case 'lowFreq':
        this.lowFilter.frequency.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        break;
      case 'midGain':
        this.midFilter.gain.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        break;
      case 'midFreq':
        this.midFilter.frequency.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        break;
      case 'highGain':
        this.highFilter.gain.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        break;
      case 'highFreq':
        this.highFilter.frequency.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        break;
    }
  }

  dispose(): void {
    this.lowFilter.disconnect();
    this.midFilter.disconnect();
    this.highFilter.disconnect();
    this.disposeBase();
  }
}
