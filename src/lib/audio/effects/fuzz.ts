import { EffectNode } from '@/lib/audio/effectNode';
import { createAudioCurve, setWaveShaperCurve } from '@/lib/audio/curveUtils';
import { createDCBlockFilter } from '@/lib/audio/filterUtils';

const CURVE_SAMPLES = 44100;
const PARAM_RAMP_TIME = 0.02;

// Big Muff-style fuzz curve — hard asymmetric clipping with flat tops
function createFuzzCurve(fuzz: number): Float32Array<ArrayBuffer> {
  const curve = createAudioCurve(CURVE_SAMPLES);
  const amount = fuzz * 80 + 5;
  for (let i = 0; i < CURVE_SAMPLES; i++) {
    const x = (i * 2) / CURVE_SAMPLES - 1;
    // Aggressive hard clipping with slight asymmetry
    const clipped = Math.tanh(x * amount);
    // Add even harmonics via asymmetry — positive half clips slightly harder
    const asymmetry = x >= 0 ? 1.0 : 0.9;
    curve[i] = clipped * asymmetry;
  }
  return curve;
}

export class FuzzEffect extends EffectNode {
  private inputBoost: GainNode;
  private preToneFilter: BiquadFilterNode;
  private waveShaperNode: WaveShaperNode;
  private dcBlockFilter: BiquadFilterNode;
  private toneFilterLow: BiquadFilterNode;
  private toneFilterHigh: BiquadFilterNode;
  private outputGain: GainNode;
  private fuzz: number;
  private toneValue: number;

  constructor(context: AudioContext) {
    super(context);

    this.fuzz = 0.7;
    this.toneValue = 0.5;

    // Sustain — pre-gain that pushes signal into the clipping stage
    this.inputBoost = context.createGain();
    this.inputBoost.gain.value = this.fuzz * 40 + 2;

    // Pre-tone — slight bass roll-off before clipping to reduce mud
    this.preToneFilter = context.createBiquadFilter();
    this.preToneFilter.type = 'highpass';
    this.preToneFilter.frequency.value = 120;
    this.preToneFilter.Q.value = 0.5;

    // Main clipping stage
    this.waveShaperNode = context.createWaveShaper();
    this.waveShaperNode.oversample = '4x';
    setWaveShaperCurve(this.waveShaperNode, () => createFuzzCurve(this.fuzz));

    // DC blocking after hard clipping
    this.dcBlockFilter = createDCBlockFilter(context);

    // Post-EQ tone shaping — crossover between low and high shelves
    // Tone knob sweeps between dark (bass-heavy) and bright (treble-heavy)
    // Classic Big Muff mid-scoop: both shelves active, mids naturally scooped
    this.toneFilterLow = context.createBiquadFilter();
    this.toneFilterLow.type = 'lowshelf';
    this.toneFilterLow.frequency.value = 500;
    this.toneFilterLow.gain.value = this.calculateLowGain(this.toneValue);

    this.toneFilterHigh = context.createBiquadFilter();
    this.toneFilterHigh.type = 'highshelf';
    this.toneFilterHigh.frequency.value = 2000;
    this.toneFilterHigh.gain.value = this.calculateHighGain(this.toneValue);

    // Output level
    this.outputGain = context.createGain();
    this.outputGain.gain.value = 0.5;

    // Signal path: input → boost → pre-tone → waveshaper → dcBlock → toneLP → toneHP → output → wet
    this.inputNode.connect(this.inputBoost);
    this.inputBoost.connect(this.preToneFilter);
    this.preToneFilter.connect(this.waveShaperNode);
    this.waveShaperNode.connect(this.dcBlockFilter);
    this.dcBlockFilter.connect(this.toneFilterLow);
    this.toneFilterLow.connect(this.toneFilterHigh);
    this.toneFilterHigh.connect(this.outputGain);
    this.outputGain.connect(this.wetNode);
  }

  // Tone knob: 0 = dark (boost lows, cut highs), 1 = bright (cut lows, boost highs)
  private calculateLowGain(tone: number): number {
    return (1 - tone) * 8 - 2;
  }

  private calculateHighGain(tone: number): number {
    return tone * 8 - 2;
  }

  setParameter(id: string, value: number): void {
    const now = this.context.currentTime;
    switch (id) {
      case 'fuzz':
        this.fuzz = value;
        this.inputBoost.gain.linearRampToValueAtTime(value * 40 + 2, now + PARAM_RAMP_TIME);
        setWaveShaperCurve(this.waveShaperNode, () => createFuzzCurve(value));
        break;
      case 'tone':
        this.toneValue = value;
        this.toneFilterLow.gain.linearRampToValueAtTime(
          this.calculateLowGain(value),
          now + PARAM_RAMP_TIME,
        );
        this.toneFilterHigh.gain.linearRampToValueAtTime(
          this.calculateHighGain(value),
          now + PARAM_RAMP_TIME,
        );
        break;
      case 'level':
        this.outputGain.gain.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
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
