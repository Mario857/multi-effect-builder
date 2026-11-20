import { EffectNode } from '@/lib/audio/effectNode';
import { createBiquadFilter } from '@/lib/audio/filterUtils';
import { RENDER_QUANTUM_FRAMES } from '@/lib/constants/dsp';
import { PHASER_DEFINITION } from '@/lib/constants/effects';

const ALLPASS_STAGE_COUNT = 6;
const BASE_FREQUENCY = 1000;
const FREQUENCY_MULTIPLIER = 1.5;
const ALLPASS_Q = 0.5;
// Peak LFO sweep of each allpass centre frequency at full depth
const MAX_SWEEP_HZ = 1000;

/**
 * Phaser: a chain of allpass filters swept by a sine LFO, with feedback
 * around the chain and a dry/wet blend that creates the moving notches.
 */
export class PhaserEffect extends EffectNode {
  private allpassFilters: BiquadFilterNode[];
  private lfo: OscillatorNode;
  private lfoGain: GainNode;
  private feedbackGain: GainNode;
  private feedbackDelay: DelayNode;

  constructor(context: AudioContext) {
    super(context);

    // Create allpass filter chain
    this.allpassFilters = [];
    for (let i = 0; i < ALLPASS_STAGE_COUNT; i++) {
      const filter = createBiquadFilter(context, {
        type: 'allpass',
        frequency: BASE_FREQUENCY * Math.pow(FREQUENCY_MULTIPLIER, i),
        q: ALLPASS_Q,
      });
      this.allpassFilters.push(filter);
    }

    this.lfo = context.createOscillator();
    this.lfo.type = 'sine';

    this.lfoGain = context.createGain();

    this.feedbackGain = context.createGain();

    // Web Audio mutes any cycle that does not contain a DelayNode, and the
    // shortest delay allowed inside a cycle is one render quantum. Chromium
    // quietly inserts that one-block delay itself, Firefox follows the spec and
    // silences the loop — an explicit DelayNode makes both behave the same.
    const feedbackDelaySeconds = RENDER_QUANTUM_FRAMES / context.sampleRate;
    this.feedbackDelay = context.createDelay(feedbackDelaySeconds);
    this.feedbackDelay.delayTime.value = feedbackDelaySeconds;

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

    // Last filter → wetNode
    const lastFilter = this.allpassFilters[this.allpassFilters.length - 1];
    lastFilter.connect(this.wetNode);

    // Feedback: last filter → feedback → delay → first filter
    lastFilter.connect(this.feedbackGain);
    this.feedbackGain.connect(this.feedbackDelay);
    this.feedbackDelay.connect(this.allpassFilters[0]);

    this.applyDefaults(PHASER_DEFINITION);
  }

  protected applyParameter(id: string, value: number): void {
    switch (id) {
      case 'rate':
        this.setParam(this.lfo.frequency, value);
        break;
      case 'depth':
        this.setParam(this.lfoGain.gain, value * MAX_SWEEP_HZ);
        break;
      case 'feedback':
        this.setParam(this.feedbackGain.gain, value);
        break;
      case 'mix':
        this.setMix(value);
        break;
    }
  }

  dispose(): void {
    this.lfo.stop();
    this.lfo.disconnect();
    this.lfoGain.disconnect();
    this.feedbackGain.disconnect();
    this.feedbackDelay.disconnect();
    for (const filter of this.allpassFilters) {
      filter.disconnect();
    }
    this.disposeBase();
  }
}
