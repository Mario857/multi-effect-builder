import { EffectNode } from '@/lib/audio/effectNode';
import { UNITY_GAIN } from '@/lib/constants/dsp';
import { TREMOLO_DEFINITION } from '@/lib/constants/effects';

// The LFO swings symmetrically around its centre, so its amplitude is half the depth
const LFO_AMPLITUDE_PER_DEPTH = 0.5;

/**
 * Tremolo: a sine LFO modulates the volume downward from unity.
 */
export class TremoloEffect extends EffectNode {
  private lfo: OscillatorNode;
  private lfoGain: GainNode;
  private tremoloGain: GainNode;

  constructor(context: AudioContext) {
    super(context);

    this.tremoloGain = context.createGain();

    this.lfo = context.createOscillator();
    this.lfo.type = 'sine';

    this.lfoGain = context.createGain();

    // LFO modulates the tremolo gain
    this.lfo.connect(this.lfoGain);
    this.lfoGain.connect(this.tremoloGain.gain);
    this.lfo.start();

    // Wet path: input → tremoloGain → wetNode
    this.inputNode.connect(this.tremoloGain);
    this.tremoloGain.connect(this.wetNode);

    this.applyDefaults(TREMOLO_DEFINITION);
  }

  protected applyParameter(id: string, value: number): void {
    switch (id) {
      case 'rate':
        this.setParam(this.lfo.frequency, value);
        break;
      case 'depth': {
        // Tremolo only ever attenuates: the gain swings between (1 - depth) and
        // unity. Centring the LFO on unity instead would boost the signal by up
        // to +6 dB on every positive half-cycle.
        const lfoAmplitude = value * LFO_AMPLITUDE_PER_DEPTH;
        this.setParam(this.tremoloGain.gain, UNITY_GAIN - lfoAmplitude);
        this.setParam(this.lfoGain.gain, lfoAmplitude);
        break;
      }
      case 'mix':
        // For tremolo, mix blends between dry and tremolo signal
        this.setMix(value);
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
