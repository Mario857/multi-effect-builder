import { EffectNode } from '@/lib/audio/effectNode';

const PARAM_RAMP_TIME = 0.02;
const ALLPASS_STAGE_COUNT = 6;
const BASE_FREQUENCY = 1000;
const FREQUENCY_MULTIPLIER = 1.5;

export class PhaserEffect extends EffectNode {
  private allpassFilters: BiquadFilterNode[];
  private lfo: OscillatorNode;
  private lfoGain: GainNode;
  private feedbackGain: GainNode;
  private wetGain: GainNode;
  private dryGain: GainNode;

  constructor(context: AudioContext) {
    super(context);

    // Create allpass filter chain
    this.allpassFilters = [];
    for (let i = 0; i < ALLPASS_STAGE_COUNT; i++) {
      const filter = context.createBiquadFilter();
      filter.type = 'allpass';
      filter.frequency.value = BASE_FREQUENCY * Math.pow(FREQUENCY_MULTIPLIER, i);
      filter.Q.value = 0.5;
      this.allpassFilters.push(filter);
    }

    this.lfo = context.createOscillator();
    this.lfo.type = 'sine';
    this.lfo.frequency.value = 0.8;

    this.lfoGain = context.createGain();
    this.lfoGain.gain.value = 500;

    this.feedbackGain = context.createGain();
    this.feedbackGain.gain.value = 0.4;

    this.wetGain = context.createGain();
    this.wetGain.gain.value = 0.5;

    this.dryGain = context.createGain();
    this.dryGain.gain.value = 0.5;

    // LFO modulates all allpass filter frequencies
    this.lfo.connect(this.lfoGain);
    for (const filter of this.allpassFilters) {
      this.lfoGain.connect(filter.frequency);
    }
    this.lfo.start();

    // Connect allpass chain: input → filter1 → filter2 → ... → filterN
    this.inputNode.connect(this.allpassFilters[0]);
    for (let i = 0; i < this.allpassFilters.length - 1; i++) {
      this.allpassFilters[i].connect(this.allpassFilters[i + 1]);
    }

    // Last filter → wetGain → wetNode
    const lastFilter = this.allpassFilters[this.allpassFilters.length - 1];
    lastFilter.connect(this.wetGain);
    this.wetGain.connect(this.wetNode);

    // Feedback: last filter → feedback → first filter
    lastFilter.connect(this.feedbackGain);
    this.feedbackGain.connect(this.allpassFilters[0]);

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
        this.lfoGain.gain.linearRampToValueAtTime(value * 1000, now + PARAM_RAMP_TIME);
        break;
      case 'feedback':
        this.feedbackGain.gain.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        break;
      case 'mix':
        this.wetGain.gain.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        this.dryGain.gain.linearRampToValueAtTime(1 - value, now + PARAM_RAMP_TIME);
        break;
    }
  }

  dispose(): void {
    this.lfo.stop();
    this.lfo.disconnect();
    this.lfoGain.disconnect();
    this.feedbackGain.disconnect();
    this.wetGain.disconnect();
    this.dryGain.disconnect();
    for (const filter of this.allpassFilters) {
      filter.disconnect();
    }
    this.disposeBase();
  }
}
