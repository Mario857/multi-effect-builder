import { EffectNode } from '@/lib/audio/effectNode';
import { createBiquadFilter } from '@/lib/audio/filterUtils';
import { DELAY_DEFINITION } from '@/lib/constants/effects';

// Size of the delay line — the top of the `time` parameter range
const MAX_DELAY_SECONDS = 2;

/**
 * Feedback delay with a lowpass in the repeat path, so each echo gets darker.
 */
export class DelayEffect extends EffectNode {
  private delayNode: DelayNode;
  private feedbackGain: GainNode;
  private toneFilter: BiquadFilterNode;

  constructor(context: AudioContext) {
    super(context);

    this.delayNode = context.createDelay(MAX_DELAY_SECONDS);
    this.feedbackGain = context.createGain();
    this.toneFilter = createBiquadFilter(context, { type: 'lowpass' });

    // Wet path: input → delay → tone → wetNode
    this.inputNode.connect(this.delayNode);
    this.delayNode.connect(this.toneFilter);
    this.toneFilter.connect(this.wetNode);

    // Feedback loop: tone → feedback → delay
    this.toneFilter.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);

    this.applyDefaults(DELAY_DEFINITION);
  }

  protected applyParameter(id: string, value: number): void {
    switch (id) {
      case 'time':
        this.setParam(this.delayNode.delayTime, value);
        break;
      case 'feedback':
        this.setParam(this.feedbackGain.gain, value);
        break;
      case 'mix':
        this.setMix(value);
        break;
      case 'tone':
        this.setParam(this.toneFilter.frequency, value);
        break;
    }
  }

  dispose(): void {
    this.delayNode.disconnect();
    this.feedbackGain.disconnect();
    this.toneFilter.disconnect();
    this.disposeBase();
  }
}
