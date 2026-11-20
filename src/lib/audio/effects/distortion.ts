import { EffectNode } from '@/lib/audio/effectNode';
import { createWaveShaperCurve } from '@/lib/audio/curveUtils';
import { createBiquadFilter, createDCBlockFilter } from '@/lib/audio/filterUtils';
import { BUTTERWORTH_Q, UNITY_GAIN, WAVESHAPER_OVERSAMPLE } from '@/lib/constants/dsp';
import { DISTORTION_DEFINITION } from '@/lib/constants/effects';

// Drive 0–1 maps to a pre-gain / curve steepness of 1–21
const DRIVE_GAIN_RANGE = 20;
// Negative half-wave clips softer than the positive one — the asymmetry adds even harmonics
const NEGATIVE_HALF_SOFTNESS = 0.7;

function driveToAmount(drive: number): number {
  return drive * DRIVE_GAIN_RANGE + UNITY_GAIN;
}

function createTubeClipCurve(drive: number): Float32Array<ArrayBuffer> {
  const amount = driveToAmount(drive);
  // Asymmetric tube-like clipping
  return createWaveShaperCurve((x) =>
    x >= 0
      ? 1 - Math.exp(-amount * x)
      : -(1 - Math.exp(amount * x * NEGATIVE_HALF_SOFTNESS)),
  );
}

/**
 * Tube-style overdrive: input boost into an asymmetric waveshaper,
 * followed by a tone lowpass and output level.
 */
export class DistortionEffect extends EffectNode {
  private inputBoost: GainNode;
  private waveShaperNode: WaveShaperNode;
  private dcBlockFilter: BiquadFilterNode;
  private toneFilter: BiquadFilterNode;
  private driveGain: GainNode;

  constructor(context: AudioContext) {
    super(context);

    // Input boost to push the signal into the waveshaper
    this.inputBoost = context.createGain();

    this.waveShaperNode = context.createWaveShaper();
    this.waveShaperNode.oversample = WAVESHAPER_OVERSAMPLE;

    // DC blocking after waveshaper prevents offset buildup
    this.dcBlockFilter = createDCBlockFilter(context);

    this.toneFilter = createBiquadFilter(context, { type: 'lowpass', q: BUTTERWORTH_Q });

    this.driveGain = context.createGain();

    // Wet path: input → boost → waveshaper → dcBlock → tone filter → drive gain → wet
    this.inputNode.connect(this.inputBoost);
    this.inputBoost.connect(this.waveShaperNode);
    this.waveShaperNode.connect(this.dcBlockFilter);
    this.dcBlockFilter.connect(this.toneFilter);
    this.toneFilter.connect(this.driveGain);
    this.driveGain.connect(this.wetNode);

    this.applyDefaults(DISTORTION_DEFINITION);
  }

  protected applyParameter(id: string, value: number): void {
    switch (id) {
      case 'drive':
        this.setParam(this.inputBoost.gain, driveToAmount(value));
        this.waveShaperNode.curve = createTubeClipCurve(value);
        break;
      case 'tone':
        this.setParam(this.toneFilter.frequency, value);
        break;
      case 'level':
        this.setParam(this.driveGain.gain, value);
        break;
      case 'mix':
        this.setMix(value);
        break;
    }
  }

  dispose(): void {
    this.inputBoost.disconnect();
    this.waveShaperNode.disconnect();
    this.dcBlockFilter.disconnect();
    this.toneFilter.disconnect();
    this.driveGain.disconnect();
    this.disposeBase();
  }
}
