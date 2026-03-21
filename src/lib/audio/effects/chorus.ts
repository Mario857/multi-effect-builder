import { EffectNode } from '@/lib/audio/effectNode';

const PARAM_RAMP_TIME = 0.02;
const DEFAULT_CHORUS_DELAY = 0.01;

export class ChorusEffect extends EffectNode {
  private delayNode: DelayNode;
  private lfo: OscillatorNode;
  private lfoGain: GainNode;
  private wetGain: GainNode;
  private dryGain: GainNode;

  constructor(context: AudioContext) {
    super(context);

    this.delayNode = context.createDelay(0.1);
    this.delayNode.delayTime.value = DEFAULT_CHORUS_DELAY;

    this.lfo = context.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = 1.5;

    this.lfoGain = context.createGain();
    this.lfoGain.gain.value = 0.005;

    this.wetGain = context.createGain();
    this.wetGain.gain.value = 0.5;

    this.dryGain = context.createGain();
    this.dryGain.gain.value = 0.5;

    // LFO modulates delay time
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.delayNode.delayTime);
    this.lfo.start();

    // Wet: input → delay → wetGain → wetNode
    this.inputNode.connect(this.delayNode);
    this.delayNode.connect(this.wetGain);
    this.wetGain.connect(this.wetNode);

    // Dry: input → dryGain → wetNode
    this.inputNode.connect(this.dryGain);
    this.dryGain.connect(this.wetNode);
  }

  setParameter(id: string, value: number): void {
    const now = this.context.currentTime;
    switch (id) {
      case 'rate':
        this.lfo.frequency.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        break;
      case 'depth':
        this.lfoGain.gain.linearRampToValueAtTime(value * 0.01, now + PARAM_RAMP_TIME);
        break;
      case 'mix':
        this.wetGain.gain.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        this.dryGain.gain.linearRampToValueAtTime(1 - value, now + PARAM_RAMP_TIME);
        break;
      case 'delay':
        this.delayNode.delayTime.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        break;
    }
  }

  dispose(): void {
    this.lfo.stop();
    this.lfo.disconnect();
    this.lfoGain.disconnect();
    this.delayNode.disconnect();
    this.wetGain.disconnect();
    this.dryGain.disconnect();
    this.disposeBase();
  }
}
