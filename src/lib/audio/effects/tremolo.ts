import { EffectNode } from '@/lib/audio/effectNode';

const PARAM_RAMP_TIME = 0.02;

export class TremoloEffect extends EffectNode {
  private lfo: OscillatorNode;
  private lfoGain: GainNode;
  private tremoloGain: GainNode;

  constructor(context: AudioContext) {
    super(context);

    this.tremoloGain = context.createGain();
    this.tremoloGain.gain.value = 1;

    this.lfo = context.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = 5;

    this.lfoGain = context.createGain();
    this.lfoGain.gain.value = 0.6;

    // LFO modulates the tremolo gain
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.tremoloGain.gain);
    this.lfo.start();

    // Wet path: input → tremoloGain → wetNode
    this.inputNode.connect(this.tremoloGain);
    this.tremoloGain.connect(this.wetNode);
  }

  setParameter(id: string, value: number): void {
    const now = this.context.currentTime;
    switch (id) {
      case 'rate':
        this.lfo.frequency.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        break;
      case 'depth':
        this.lfoGain.gain.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        break;
      case 'mix':
        // For tremolo, mix blends between dry and tremolo signal
        break;
    }
  }

  dispose(): void {
    this.lfo.stop();
    this.lfo.disconnect();
    this.lfoGain.disconnect();
    this.tremoloGain.disconnect();
    this.disposeBase();
  }
}
