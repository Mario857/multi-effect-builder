import { EffectNode } from '@/lib/audio/effectNode';
import { createAudioCurve, setWaveShaperCurve } from '@/lib/audio/curveUtils';
import type { EffectType } from '@/types/audio';
import { EFFECT_TYPE } from '@/types/audio';

const PARAM_RAMP_TIME = 0.02;
const CURVE_SAMPLES = 44100;
const CAB_IR_LENGTH_SECONDS = 0.1;

interface AmpCharacter {
  readonly preampCurveGenerator: (gain: number) => Float32Array<ArrayBuffer>;
  readonly bassFreq: number;
  readonly midFreq: number;
  readonly midQ: number;
  readonly trebleFreq: number;
  readonly presenceFreq: number;
  readonly cabDecay: number;
  readonly cabBrightness: number;
}

// Fender-style clean: gentle soft clipping, bright and open
function createCleanCurve(gain: number): Float32Array<ArrayBuffer> {
  const curve = createAudioCurve(CURVE_SAMPLES);
  const amount = gain * 5 + 1;
  for (let i = 0; i < CURVE_SAMPLES; i++) {
    const x = (i * 2) / CURVE_SAMPLES - 1;
    curve[i] = Math.tanh(x * amount) * 0.8;
  }
  return curve;
}

// Marshall-style crunch: moderate asymmetric clipping
function createCrunchCurve(gain: number): Float32Array<ArrayBuffer> {
  const curve = createAudioCurve(CURVE_SAMPLES);
  const amount = gain * 20 + 2;
  for (let i = 0; i < CURVE_SAMPLES; i++) {
    const x = (i * 2) / CURVE_SAMPLES - 1;
    if (x >= 0) {
      curve[i] = 1 - Math.exp(-amount * x);
    } else {
      curve[i] = -(1 - Math.exp(amount * x * 0.8));
    }
  }
  return curve;
}

// Mesa-style high gain: heavy saturation with tight response
function createHighGainCurve(gain: number): Float32Array<ArrayBuffer> {
  const curve = createAudioCurve(CURVE_SAMPLES);
  const amount = gain * 80 + 5;
  for (let i = 0; i < CURVE_SAMPLES; i++) {
    const x = (i * 2) / CURVE_SAMPLES - 1;
    const shaped = x * amount;
    curve[i] = shaped / (1 + Math.abs(shaped));
  }
  return curve;
}

// Acoustic sim: very mild, transparent
function createAcousticCurve(gain: number): Float32Array<ArrayBuffer> {
  const curve = createAudioCurve(CURVE_SAMPLES);
  const amount = gain * 2 + 0.5;
  for (let i = 0; i < CURVE_SAMPLES; i++) {
    const x = (i * 2) / CURVE_SAMPLES - 1;
    curve[i] = Math.tanh(x * amount);
  }
  return curve;
}

const AMP_CHARACTERS: Record<string, AmpCharacter> = {
  [EFFECT_TYPE.AMP_CLEAN]: {
    preampCurveGenerator: createCleanCurve,
    bassFreq: 150,
    midFreq: 800,
    midQ: 1.0,
    trebleFreq: 4000,
    presenceFreq: 6000,
    cabDecay: 0.05,
    cabBrightness: 0.7,
  },
  [EFFECT_TYPE.AMP_CRUNCH]: {
    preampCurveGenerator: createCrunchCurve,
    bassFreq: 200,
    midFreq: 1000,
    midQ: 1.5,
    trebleFreq: 3500,
    presenceFreq: 5500,
    cabDecay: 0.08,
    cabBrightness: 0.5,
  },
  [EFFECT_TYPE.AMP_HIGHGAIN]: {
    preampCurveGenerator: createHighGainCurve,
    bassFreq: 100,
    midFreq: 700,
    midQ: 2.0,
    trebleFreq: 3000,
    presenceFreq: 5000,
    cabDecay: 0.1,
    cabBrightness: 0.3,
  },
  [EFFECT_TYPE.AMP_ACOUSTIC]: {
    preampCurveGenerator: createAcousticCurve,
    bassFreq: 200,
    midFreq: 1200,
    midQ: 0.8,
    trebleFreq: 5000,
    presenceFreq: 8000,
    cabDecay: 0.03,
    cabBrightness: 0.9,
  },
};

function generateCabIR(context: AudioContext, decay: number, brightness: number): AudioBuffer {
  const sampleRate = context.sampleRate;
  const length = Math.floor(sampleRate * CAB_IR_LENGTH_SECONDS);
  const buffer = context.createBuffer(2, length, sampleRate);
  const channelL = buffer.getChannelData(0);
  const channelR = buffer.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * (10 / decay));
    // Brightness controls high-frequency content
    const hfRolloff = 1 - (1 - brightness) * (t / (CAB_IR_LENGTH_SECONDS * 0.5));
    const amplitude = envelope * Math.max(0, hfRolloff);
    channelL[i] = (Math.random() * 2 - 1) * amplitude;
    channelR[i] = (Math.random() * 2 - 1) * amplitude;
  }

  // Add a small initial peak to simulate speaker cone response
  const peakSamples = Math.floor(sampleRate * 0.001);
  for (let i = 0; i < peakSamples; i++) {
    const scale = 1 + brightness * 2;
    channelL[i] *= scale;
    channelR[i] *= scale;
  }

  return buffer;
}

export class AmpSimulatorEffect extends EffectNode {
  private preampWaveShaper: WaveShaperNode;
  private bassFilter: BiquadFilterNode;
  private midFilter: BiquadFilterNode;
  private trebleFilter: BiquadFilterNode;
  private presenceFilter: BiquadFilterNode;
  private cabinetConvolver: ConvolverNode;
  private masterGain: GainNode;
  private character: AmpCharacter;
  private currentGain: number;

  constructor(context: AudioContext, ampType: EffectType) {
    super(context);

    this.character = AMP_CHARACTERS[ampType] || AMP_CHARACTERS[EFFECT_TYPE.AMP_CLEAN];
    this.currentGain = 0.5;

    // Preamp stage
    this.preampWaveShaper = context.createWaveShaper();
    this.preampWaveShaper.oversample = '4x';
    setWaveShaperCurve(this.preampWaveShaper, () => this.character.preampCurveGenerator(this.currentGain));

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

    // Cabinet simulation
    this.cabinetConvolver = context.createConvolver();
    this.cabinetConvolver.buffer = generateCabIR(
      context,
      this.character.cabDecay,
      this.character.cabBrightness,
    );

    // Master volume
    this.masterGain = context.createGain();
    this.masterGain.gain.value = 0.7;

    // Signal path: input → preamp → bass → mid → treble → presence → cabinet → master → wetNode
    this.inputNode.connect(this.preampWaveShaper);
    this.preampWaveShaper.connect(this.bassFilter);
    this.bassFilter.connect(this.midFilter);
    this.midFilter.connect(this.trebleFilter);
    this.trebleFilter.connect(this.presenceFilter);
    this.presenceFilter.connect(this.cabinetConvolver);
    this.cabinetConvolver.connect(this.masterGain);
    this.masterGain.connect(this.wetNode);
  }

  setParameter(id: string, value: number): void {
    const now = this.context.currentTime;
    switch (id) {
      case 'gain':
        this.currentGain = value;
        setWaveShaperCurve(this.preampWaveShaper, () => this.character.preampCurveGenerator(value));
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
    this.preampWaveShaper.disconnect();
    this.bassFilter.disconnect();
    this.midFilter.disconnect();
    this.trebleFilter.disconnect();
    this.presenceFilter.disconnect();
    this.cabinetConvolver.disconnect();
    this.masterGain.disconnect();
    this.disposeBase();
  }
}
