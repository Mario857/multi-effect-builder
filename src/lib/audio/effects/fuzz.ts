import { EffectNode } from '@/lib/audio/effectNode';
import { createWaveShaperCurve } from '@/lib/audio/curveUtils';
import { createBiquadFilter, createDCBlockFilter } from '@/lib/audio/filterUtils';
import { WAVESHAPER_OVERSAMPLE } from '@/lib/constants/dsp';
import { FUZZ_DEFINITION } from '@/lib/constants/effects';

// Fuzz 0–1 maps to a clipping curve steepness of 5–85
const CURVE_AMOUNT_RANGE = 80;
const CURVE_AMOUNT_MIN = 5;
// Fuzz 0–1 maps to a sustain pre-gain of 2–42
const SUSTAIN_GAIN_RANGE = 40;
const SUSTAIN_GAIN_MIN = 2;
// Output scale of the negative half-wave relative to the positive one
const NEGATIVE_HALF_SCALE = 0.9;

const PRE_TONE_FREQUENCY = 120;
const PRE_TONE_Q = 0.5;
const TONE_LOW_SHELF_FREQUENCY = 500;
const TONE_HIGH_SHELF_FREQUENCY = 2000;
// Each tone shelf sweeps from -2 dB to +6 dB across the knob's travel
const TONE_SHELF_RANGE_DB = 8;
const TONE_SHELF_MIN_DB = -2;

// Big Muff-style fuzz curve — hard asymmetric clipping with flat tops
function createFuzzCurve(fuzz: number): Float32Array<ArrayBuffer> {
  const amount = fuzz * CURVE_AMOUNT_RANGE + CURVE_AMOUNT_MIN;
  return createWaveShaperCurve((x) => {
    // Aggressive hard clipping with slight asymmetry
    const clipped = Math.tanh(x * amount);
    // Add even harmonics via asymmetry — positive half clips slightly harder
    return x >= 0 ? clipped : clipped * NEGATIVE_HALF_SCALE;
  });
}

// Tone knob: 0 = dark (boost lows, cut highs), 1 = bright (cut lows, boost highs)
function calculateLowGain(tone: number): number {
  return (1 - tone) * TONE_SHELF_RANGE_DB + TONE_SHELF_MIN_DB;
}

function calculateHighGain(tone: number): number {
  return tone * TONE_SHELF_RANGE_DB + TONE_SHELF_MIN_DB;
}

/**
 * Big Muff-style fuzz: heavy pre-gain into a hard clipper,
 * with a tilt-style tone control and output level.
 */
export class FuzzEffect extends EffectNode {
  private inputBoost: GainNode;
  private preToneFilter: BiquadFilterNode;
  private waveShaperNode: WaveShaperNode;
  private dcBlockFilter: BiquadFilterNode;
  private toneFilterLow: BiquadFilterNode;
  private toneFilterHigh: BiquadFilterNode;
  private outputGain: GainNode;

  constructor(context: AudioContext) {
    super(context);

    // Sustain — pre-gain that pushes signal into the clipping stage
    this.inputBoost = context.createGain();

    // Pre-tone — slight bass roll-off before clipping to reduce mud
    this.preToneFilter = createBiquadFilter(context, {
      type: 'highpass',
      frequency: PRE_TONE_FREQUENCY,
      q: PRE_TONE_Q,
    });

    // Main clipping stage
    this.waveShaperNode = context.createWaveShaper();
    this.waveShaperNode.oversample = WAVESHAPER_OVERSAMPLE;

    // DC blocking after hard clipping
    this.dcBlockFilter = createDCBlockFilter(context);

    // Post-EQ tone shaping — crossover between low and high shelves
    // Tone knob sweeps between dark (bass-heavy) and bright (treble-heavy)
    // Classic Big Muff mid-scoop: both shelves active, mids naturally scooped
    this.toneFilterLow = createBiquadFilter(context, {
      type: 'lowshelf',
      frequency: TONE_LOW_SHELF_FREQUENCY,
    });
    this.toneFilterHigh = createBiquadFilter(context, {
      type: 'highshelf',
      frequency: TONE_HIGH_SHELF_FREQUENCY,
    });

    // Output level
    this.outputGain = context.createGain();

    // Signal path: input → boost → pre-tone → waveshaper → dcBlock → toneLP → toneHP → output → wet
    this.inputNode.connect(this.inputBoost);
    this.inputBoost.connect(this.preToneFilter);
    this.preToneFilter.connect(this.waveShaperNode);
    this.waveShaperNode.connect(this.dcBlockFilter);
    this.dcBlockFilter.connect(this.toneFilterLow);
    this.toneFilterLow.connect(this.toneFilterHigh);
    this.toneFilterHigh.connect(this.outputGain);
    this.outputGain.connect(this.wetNode);

    this.applyDefaults(FUZZ_DEFINITION);
  }

  protected applyParameter(id: string, value: number): void {
    switch (id) {
      case 'fuzz':
        this.setParam(this.inputBoost.gain, value * SUSTAIN_GAIN_RANGE + SUSTAIN_GAIN_MIN);
        this.waveShaperNode.curve = createFuzzCurve(value);
        break;
      case 'tone':
        this.setParam(this.toneFilterLow.gain, calculateLowGain(value));
        this.setParam(this.toneFilterHigh.gain, calculateHighGain(value));
        break;
      case 'level':
        this.setParam(this.outputGain.gain, value);
        break;
    }
  }

  dispose(): void {
    this.inputBoost.disconnect();
    this.preToneFilter.disconnect();
    this.waveShaperNode.disconnect();
    this.dcBlockFilter.disconnect();
    this.toneFilterLow.disconnect();
    this.toneFilterHigh.disconnect();
    this.outputGain.disconnect();
    this.disposeBase();
  }
}
