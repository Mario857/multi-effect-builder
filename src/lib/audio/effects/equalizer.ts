import { EffectNode } from '@/lib/audio/effectNode';
import { createBiquadFilter } from '@/lib/audio/filterUtils';
import { EQ_DEFINITION } from '@/lib/constants/effects';

const DEFAULT_Q = 1.5;

/**
 * Three-band equalizer: low shelf, peaking mid, high shelf.
 */
export class EqualizerEffect extends EffectNode {
  private lowFilter: BiquadFilterNode;
  private midFilter: BiquadFilterNode;
  private highFilter: BiquadFilterNode;

  constructor(context: AudioContext) {
    super(context);

    this.lowFilter = createBiquadFilter(context, { type: 'lowshelf' });
    this.midFilter = createBiquadFilter(context, { type: 'peaking', q: DEFAULT_Q });
    this.highFilter = createBiquadFilter(context, { type: 'highshelf' });

    // Wet path: input → low → mid → high → wetNode
    this.inputNode.connect(this.lowFilter);
    this.lowFilter.connect(this.midFilter);
    this.midFilter.connect(this.highFilter);
    this.highFilter.connect(this.wetNode);

    this.applyDefaults(EQ_DEFINITION);
  }

  protected applyParameter(id: string, value: number): void {
    switch (id) {
      case 'lowGain':
        this.setParam(this.lowFilter.gain, value);
        break;
      case 'lowFreq':
        this.setParam(this.lowFilter.frequency, value);
        break;
      case 'midGain':
        this.setParam(this.midFilter.gain, value);
        break;
      case 'midFreq':
        this.setParam(this.midFilter.frequency, value);
        break;
      case 'highGain':
        this.setParam(this.highFilter.gain, value);
        break;
      case 'highFreq':
        this.setParam(this.highFilter.frequency, value);
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
