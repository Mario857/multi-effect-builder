import { EffectNode } from '@/lib/audio/effectNode';

const DEFAULT_DELAY_TIME = 0.4;
const DEFAULT_FEEDBACK = 0.4;
const DEFAULT_TONE = 4000;
const PARAM_RAMP_TIME = 0.02;

export class DelayEffect extends EffectNode {
  private delayNode: DelayNode;
  private feedbackGain: GainNode;
  private toneFilter: BiquadFilterNode;
  private wetGain: GainNode;
  private dryGain: GainNode;

  constructor(context: AudioContext) {
    super(context);

    this.delayNode = context.createDelay(5);
    this.delayNode.delayTime.value = DEFAULT_DELAY_TIME;

    this.feedbackGain = context.createGain();
    this.feedbackGain.gain.value = DEFAULT_FEEDBACK;

    this.toneFilter = context.createBiquadFilter();
    this.toneFilter.type = 'lowpass';
    this.toneFilter.frequency.value = DEFAULT_TONE;

    this.wetGain = context.createGain();
    this.wetGain.gain.value = 0.3;

    this.dryGain = context.createGain();
    this.dryGain.gain.value = 0.7;

    // Wet path: input → delay → tone → wetGain → wetNode
    this.inputNode.connect(this.delayNode);
    this.delayNode.connect(this.toneFilter);
    this.toneFilter.connect(this.wetGain);
    this.wetGain.connect(this.wetNode);

    // Feedback loop: tone → feedback → delay
    this.toneFilter.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);

    // Dry path through wetNode for mix control
    this.inputNode.connect(this.dryGain);
    this.dryGain.connect(this.wetNode);
  }

  setParameter(id: string, value: number): void {
    const now = this.context.currentTime;
    switch (id) {
      case 'time':
        this.delayNode.delayTime.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        break;
      case 'feedback':
        this.feedbackGain.gain.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        break;
      case 'mix':
        this.wetGain.gain.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        this.dryGain.gain.linearRampToValueAtTime(1 - value, now + PARAM_RAMP_TIME);
        break;
      case 'tone':
        this.toneFilter.frequency.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        break;
    }
  }

  dispose(): void {
    this.delayNode.disconnect();
    this.feedbackGain.disconnect();
    this.toneFilter.disconnect();
    this.wetGain.disconnect();
    this.dryGain.disconnect();
    this.disposeBase();
  }
}
