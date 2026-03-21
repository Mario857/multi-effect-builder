import { EffectNode } from '@/lib/audio/effectNode';
import { createAudioCurve, setWaveShaperCurve } from '@/lib/audio/curveUtils';
import { createDCBlockFilter } from '@/lib/audio/filterUtils';
import type { EffectType } from '@/types/audio';
import { EFFECT_TYPE } from '@/types/audio';

const PARAM_RAMP_TIME = 0.02;
const CURVE_SAMPLES = 8192;

// Preamp boost per type — controls how hard the signal hits the waveshaper.
// Must be high enough that a typical guitar signal (~0.03 RMS) reaches the
// saturation region of each curve. Crunch at 6 is the proven reference.
const PREAMP_BOOST_CLEAN = 8;
const PREAMP_BOOST_CRUNCH = 6;
const PREAMP_BOOST_HIGHGAIN = 8;
const PREAMP_BOOST_ACOUSTIC = 8;

interface AmpCharacter {
  readonly preampCurveGenerator: (gain: number) => Float32Array<ArrayBuffer>;
  readonly secondStageCurveGenerator?: (gain: number) => Float32Array<ArrayBuffer>;
  readonly preampBoost: number;
  readonly postTrim: number;
  readonly bassFreq: number;
  readonly midFreq: number;
  readonly midQ: number;
  readonly trebleFreq: number;
  readonly presenceFreq: number;
  readonly inputHighCut: number;
  // Post-clipping smoothing — simulates coupling capacitor bandwidth between stages
  readonly smoothingCutoff: number;
  // Cabinet speaker simulation — filter chain instead of convolution
  readonly cabCutoff: number;
  readonly cabCutoffQ: number;
  readonly cabBodyFreq: number;
  readonly cabBodyGain: number;
  readonly cabBodyQ: number;
}

// Fender-style clean: gentle soft clipping, bright and open
function createCleanCurve(gain: number): Float32Array<ArrayBuffer> {
  const curve = createAudioCurve(CURVE_SAMPLES);
  const amount = gain * 8 + 1;
  for (let i = 0; i < CURVE_SAMPLES; i++) {
    const x = (i * 2) / CURVE_SAMPLES - 1;
    curve[i] = Math.tanh(x * amount);
  }
  return curve;
}

// Marshall-style crunch: asymmetric tube clipping
function createCrunchCurve(gain: number): Float32Array<ArrayBuffer> {
  const curve = createAudioCurve(CURVE_SAMPLES);
  const amount = gain * 15 + 2;
  for (let i = 0; i < CURVE_SAMPLES; i++) {
    const x = (i * 2) / CURVE_SAMPLES - 1;
    if (x >= 0) {
      curve[i] = 1 - Math.exp(-amount * x);
    } else {
      curve[i] = -(1 - Math.exp(amount * x * 0.5));
    }
  }
  return curve;
}

// Mesa-style high gain stage 1: controlled saturation
function createHighGainCurve(gain: number): Float32Array<ArrayBuffer> {
  const curve = createAudioCurve(CURVE_SAMPLES);
  const amount = gain * 20 + 4;
  for (let i = 0; i < CURVE_SAMPLES; i++) {
    const x = (i * 2) / CURVE_SAMPLES - 1;
    if (x >= 0) {
      curve[i] = 1 - Math.exp(-amount * x);
    } else {
      curve[i] = -(1 - Math.exp(amount * x * 0.7));
    }
  }
  return curve;
}

// High gain stage 2: gentle compression, adds harmonics without more fizz
function createHighGainStage2Curve(gain: number): Float32Array<ArrayBuffer> {
  const curve = createAudioCurve(CURVE_SAMPLES);
  const amount = gain * 8 + 2;
  for (let i = 0; i < CURVE_SAMPLES; i++) {
    const x = (i * 2) / CURVE_SAMPLES - 1;
    curve[i] = Math.tanh(x * amount) * 0.95;
  }
  return curve;
}

// Acoustic sim: transparent with mild warmth
function createAcousticCurve(gain: number): Float32Array<ArrayBuffer> {
  const curve = createAudioCurve(CURVE_SAMPLES);
  const amount = gain * 3 + 1;
  for (let i = 0; i < CURVE_SAMPLES; i++) {
    const x = (i * 2) / CURVE_SAMPLES - 1;
    curve[i] = Math.tanh(x * amount);
  }
  return curve;
}

const AMP_CHARACTERS: Record<string, AmpCharacter> = {
  [EFFECT_TYPE.AMP_CLEAN]: {
    preampCurveGenerator: createCleanCurve,
    preampBoost: PREAMP_BOOST_CLEAN,
    postTrim: 0.85,
    bassFreq: 150,
    midFreq: 800,
    midQ: 1.0,
    trebleFreq: 4000,
    presenceFreq: 6000,
    inputHighCut: 7000,
    smoothingCutoff: 7000,
    // Bright, open speaker — Fender-style sparkle with warm rolloff
    cabCutoff: 5500,
    cabCutoffQ: 0.9,
    cabBodyFreq: 140,
    cabBodyGain: 2,
    cabBodyQ: 0.8,
  },
  [EFFECT_TYPE.AMP_CRUNCH]: {
    preampCurveGenerator: createCrunchCurve,
    preampBoost: PREAMP_BOOST_CRUNCH,
    postTrim: 0.7,
    bassFreq: 200,
    midFreq: 1000,
    midQ: 1.5,
    trebleFreq: 3500,
    presenceFreq: 5500,
    inputHighCut: 5500,
    smoothingCutoff: 5500,
    // Marshall-style 4x12 — mid-forward, warm, no fizz
    cabCutoff: 4800,
    cabCutoffQ: 1.0,
    cabBodyFreq: 120,
    cabBodyGain: 2.5,
    cabBodyQ: 1.0,
  },
  [EFFECT_TYPE.AMP_HIGHGAIN]: {
    preampCurveGenerator: createHighGainCurve,
    secondStageCurveGenerator: createHighGainStage2Curve,
    preampBoost: PREAMP_BOOST_HIGHGAIN,
    postTrim: 0.5,
    bassFreq: 100,
    midFreq: 700,
    midQ: 2.0,
    trebleFreq: 3000,
    presenceFreq: 5000,
    inputHighCut: 5000,
    // Aggressive smoothing — high gain generates the most harsh harmonics
    smoothingCutoff: 4500,
    // Tight Mesa-style cab — focused, not boomy
    cabCutoff: 4400,
    cabCutoffQ: 1.1,
    cabBodyFreq: 100,
    cabBodyGain: 2,
    cabBodyQ: 1.2,
  },
  [EFFECT_TYPE.AMP_ACOUSTIC]: {
    preampCurveGenerator: createAcousticCurve,
    preampBoost: PREAMP_BOOST_ACOUSTIC,
    postTrim: 0.9,
    bassFreq: 200,
    midFreq: 1200,
    midQ: 0.8,
    trebleFreq: 5000,
    presenceFreq: 8000,
    inputHighCut: 8000,
    smoothingCutoff: 8000,
    // Acoustic — full-range, transparent, gentle warmth
    cabCutoff: 6000,
    cabCutoffQ: 0.7,
    cabBodyFreq: 160,
    cabBodyGain: 1.5,
    cabBodyQ: 0.7,
  },
};

export class AmpSimulatorEffect extends EffectNode {
  private inputLowCut: BiquadFilterNode;
  private inputHighCut: BiquadFilterNode;
  private preampGain: GainNode;
  private preampWaveShaper: WaveShaperNode;
  private dcBlock1: BiquadFilterNode;
  private cascadedStage: WaveShaperNode | null;
  private dcBlock2: BiquadFilterNode | null;
  private smoothingFilter: BiquadFilterNode;
  private postGainTrim: GainNode;
  private bassFilter: BiquadFilterNode;
  private midFilter: BiquadFilterNode;
  private trebleFilter: BiquadFilterNode;
  private presenceFilter: BiquadFilterNode;
  private cabLowpass1: BiquadFilterNode;
  private cabLowpass2: BiquadFilterNode;
  private cabBody: BiquadFilterNode;
  private masterGain: GainNode;
  private character: AmpCharacter;
  private currentGain: number;

  constructor(context: AudioContext, ampType: EffectType) {
    super(context);

    this.character = AMP_CHARACTERS[ampType] || AMP_CHARACTERS[EFFECT_TYPE.AMP_CLEAN];
    this.currentGain = 0.5;

    // Input filtering — tight bandpass before any amplification
    this.inputLowCut = context.createBiquadFilter();
    this.inputLowCut.type = 'highpass';
    this.inputLowCut.frequency.value = 100;
    this.inputLowCut.Q.value = 0.7;

    this.inputHighCut = context.createBiquadFilter();
    this.inputHighCut.type = 'lowpass';
    this.inputHighCut.frequency.value = this.character.inputHighCut;
    this.inputHighCut.Q.value = 0.7;

    // Preamp gain stage
    this.preampGain = context.createGain();
    this.preampGain.gain.value = this.character.preampBoost * this.currentGain + 1;

    // Primary waveshaper stage
    this.preampWaveShaper = context.createWaveShaper();
    this.preampWaveShaper.oversample = '4x';
    setWaveShaperCurve(this.preampWaveShaper, () => this.character.preampCurveGenerator(this.currentGain));

    this.dcBlock1 = createDCBlockFilter(context);

    // Optional cascaded second stage
    this.cascadedStage = null;
    this.dcBlock2 = null;
    if (this.character.secondStageCurveGenerator) {
      this.cascadedStage = context.createWaveShaper();
      this.cascadedStage.oversample = '4x';
      setWaveShaperCurve(
        this.cascadedStage,
        () => this.character.secondStageCurveGenerator!(this.currentGain),
      );
      this.dcBlock2 = createDCBlockFilter(context);
    }

    // Post-clipping smoothing — simulates coupling capacitor between tube stages.
    // Rounds off harsh waveshaper harmonics before they hit the tone stack.
    this.smoothingFilter = context.createBiquadFilter();
    this.smoothingFilter.type = 'lowpass';
    this.smoothingFilter.frequency.value = this.character.smoothingCutoff;
    this.smoothingFilter.Q.value = 0.35;

    // Post-gain trim — per amp type to normalize output levels
    this.postGainTrim = context.createGain();
    this.postGainTrim.gain.value = this.character.postTrim;

    // Tone stack
    this.bassFilter = context.createBiquadFilter();
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.value = this.character.bassFreq;
    this.bassFilter.gain.value = 0;

    this.midFilter = context.createBiquadFilter();
    this.midFilter.type = 'peaking';
    this.midFilter.frequency.value = this.character.midFreq;
    this.midFilter.Q.value = this.character.midQ;
    this.midFilter.gain.value = 0;

    this.trebleFilter = context.createBiquadFilter();
    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.value = this.character.trebleFreq;
    this.trebleFilter.gain.value = 0;

    this.presenceFilter = context.createBiquadFilter();
    this.presenceFilter.type = 'peaking';
    this.presenceFilter.frequency.value = this.character.presenceFreq;
    this.presenceFilter.Q.value = 1.0;
    this.presenceFilter.gain.value = 0;

    // Cabinet speaker simulation — cascaded lowpass for steep rolloff like a real speaker
    // Two lowpass stages = 4th-order (24dB/oct) — tames harsh harmonics aggressively
    this.cabLowpass1 = context.createBiquadFilter();
    this.cabLowpass1.type = 'lowpass';
    this.cabLowpass1.frequency.value = this.character.cabCutoff;
    this.cabLowpass1.Q.value = this.character.cabCutoffQ;

    // Second stage offset higher — steep rolloff above the cutoff but doesn't
    // double-kill the presence region right at the knee
    this.cabLowpass2 = context.createBiquadFilter();
    this.cabLowpass2.type = 'lowpass';
    this.cabLowpass2.frequency.value = this.character.cabCutoff * 1.4;
    this.cabLowpass2.Q.value = 0.5;

    // Body: speaker cone resonance adds warmth and thump
    this.cabBody = context.createBiquadFilter();
    this.cabBody.type = 'peaking';
    this.cabBody.frequency.value = this.character.cabBodyFreq;
    this.cabBody.gain.value = this.character.cabBodyGain;
    this.cabBody.Q.value = this.character.cabBodyQ;

    // Master volume
    this.masterGain = context.createGain();
    this.masterGain.gain.value = 0.7;

    // Signal path:
    // input → lowCut → highCut → preampGain → waveshaper1 → dcBlock1
    //   → [waveshaper2 → dcBlock2] → smoothing → postTrim
    //   → tone stack → cabBody → cabLP1 → cabLP2 → master → wet
    this.inputNode.connect(this.inputLowCut);
    this.inputLowCut.connect(this.inputHighCut);
    this.inputHighCut.connect(this.preampGain);
    this.preampGain.connect(this.preampWaveShaper);
    this.preampWaveShaper.connect(this.dcBlock1);

    let lastStage: AudioNode = this.dcBlock1;
    if (this.cascadedStage && this.dcBlock2) {
      this.dcBlock1.connect(this.cascadedStage);
      this.cascadedStage.connect(this.dcBlock2);
      lastStage = this.dcBlock2;
    }

    lastStage.connect(this.smoothingFilter);
    this.smoothingFilter.connect(this.postGainTrim);
    this.postGainTrim.connect(this.bassFilter);
    this.bassFilter.connect(this.midFilter);
    this.midFilter.connect(this.trebleFilter);
    this.trebleFilter.connect(this.presenceFilter);
    this.presenceFilter.connect(this.cabBody);
    this.cabBody.connect(this.cabLowpass1);
    this.cabLowpass1.connect(this.cabLowpass2);
    this.cabLowpass2.connect(this.masterGain);
    this.masterGain.connect(this.wetNode);
  }

  setParameter(id: string, value: number): void {
    const now = this.context.currentTime;
    switch (id) {
      case 'gain':
        this.currentGain = value;
        this.preampGain.gain.linearRampToValueAtTime(
          this.character.preampBoost * value + 1,
          now + PARAM_RAMP_TIME,
        );
        setWaveShaperCurve(this.preampWaveShaper, () => this.character.preampCurveGenerator(value));
        if (this.cascadedStage && this.character.secondStageCurveGenerator) {
          setWaveShaperCurve(
            this.cascadedStage,
            () => this.character.secondStageCurveGenerator!(value),
          );
        }
        break;
      case 'bass':
        this.bassFilter.gain.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        break;
      case 'mid':
        this.midFilter.gain.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        break;
      case 'treble':
        this.trebleFilter.gain.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        break;
      case 'presence':
        this.presenceFilter.gain.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        break;
      case 'master':
        this.masterGain.gain.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        break;
    }
  }

  dispose(): void {
    this.inputLowCut.disconnect();
    this.inputHighCut.disconnect();
    this.preampGain.disconnect();
    this.preampWaveShaper.disconnect();
    this.dcBlock1.disconnect();
    this.cascadedStage?.disconnect();
    this.dcBlock2?.disconnect();
    this.smoothingFilter.disconnect();
    this.postGainTrim.disconnect();
    this.bassFilter.disconnect();
    this.midFilter.disconnect();
    this.trebleFilter.disconnect();
    this.presenceFilter.disconnect();
    this.cabBody.disconnect();
    this.cabLowpass1.disconnect();
    this.cabLowpass2.disconnect();
    this.masterGain.disconnect();
    this.disposeBase();
  }
}
