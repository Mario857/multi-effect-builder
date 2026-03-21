import { EffectNode } from '@/lib/audio/effectNode';
import { TubePreampNode } from '@/lib/audio/worklets/tubePreampNode';
import { getCachedCabIR } from '@/lib/audio/cabImpulseResponse';
import type { EffectType } from '@/types/audio';
import { EFFECT_TYPE } from '@/types/audio';

const PARAM_RAMP_TIME = 0.02;

interface AmpCharacter {
  readonly postTrim: number;
  readonly bassFreq: number;
  readonly midFreq: number;
  readonly midQ: number;
  readonly trebleFreq: number;
  readonly presenceFreq: number;
  readonly inputHighCut: number;
  // Post-clipping smoothing — simulates coupling capacitor bandwidth between stages
  readonly smoothingCutoff: number;
  // Filter chain cab fallback — used when IR file is not available
  readonly cabCutoff: number;
  readonly cabCutoffQ: number;
  readonly cabBodyFreq: number;
  readonly cabBodyGain: number;
  readonly cabBodyQ: number;
}

const AMP_CHARACTERS: Record<string, AmpCharacter> = {
  [EFFECT_TYPE.AMP_CLEAN]: {
    postTrim: 0.85,
    bassFreq: 150,
    midFreq: 800,
    midQ: 1.0,
    trebleFreq: 4000,
    presenceFreq: 6000,
    inputHighCut: 7000,
    smoothingCutoff: 7000,
    cabCutoff: 5500,
    cabCutoffQ: 0.9,
    cabBodyFreq: 140,
    cabBodyGain: 2,
    cabBodyQ: 0.8,
  },
  [EFFECT_TYPE.AMP_CRUNCH]: {
    postTrim: 0.7,
    bassFreq: 200,
    midFreq: 1000,
    midQ: 1.5,
    trebleFreq: 3500,
    presenceFreq: 5500,
    inputHighCut: 5500,
    smoothingCutoff: 5500,
    cabCutoff: 4800,
    cabCutoffQ: 1.0,
    cabBodyFreq: 120,
    cabBodyGain: 2.5,
    cabBodyQ: 1.0,
  },
  [EFFECT_TYPE.AMP_HIGHGAIN]: {
    postTrim: 0.5,
    bassFreq: 100,
    midFreq: 700,
    midQ: 2.0,
    trebleFreq: 3000,
    presenceFreq: 5000,
    inputHighCut: 5000,
    smoothingCutoff: 4500,
    cabCutoff: 4400,
    cabCutoffQ: 1.1,
    cabBodyFreq: 100,
    cabBodyGain: 2,
    cabBodyQ: 1.2,
  },
  [EFFECT_TYPE.AMP_ACOUSTIC]: {
    postTrim: 0.9,
    bassFreq: 200,
    midFreq: 1200,
    midQ: 0.8,
    trebleFreq: 5000,
    presenceFreq: 8000,
    inputHighCut: 8000,
    smoothingCutoff: 8000,
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
  private tubePreamp: TubePreampNode;
  private smoothingFilter: BiquadFilterNode;
  private postGainTrim: GainNode;
  private bassFilter: BiquadFilterNode;
  private midFilter: BiquadFilterNode;
  private trebleFilter: BiquadFilterNode;
  private presenceFilter: BiquadFilterNode;
  // Cabinet simulation — ConvolverNode with real IR, or filter chain fallback
  private cabConvolver: ConvolverNode | null;
  private cabLowpass1: BiquadFilterNode | null;
  private cabLowpass2: BiquadFilterNode | null;
  private cabBody: BiquadFilterNode | null;
  private masterGain: GainNode;
  private character: AmpCharacter;

  /**
   * Use AmpSimulatorEffect.create() instead — the worklet module must be
   * registered on the AudioContext before constructing the node.
   */
  private constructor(context: AudioContext, tubePreamp: TubePreampNode, ampType: EffectType) {
    super(context);

    this.character = AMP_CHARACTERS[ampType] || AMP_CHARACTERS[EFFECT_TYPE.AMP_CLEAN];
    this.tubePreamp = tubePreamp;

    // Input filtering — tight bandpass before any amplification
    this.inputLowCut = context.createBiquadFilter();
    this.inputLowCut.type = 'highpass';
    this.inputLowCut.frequency.value = 100;
    this.inputLowCut.Q.value = 0.7;

    this.inputHighCut = context.createBiquadFilter();
    this.inputHighCut.type = 'lowpass';
    this.inputHighCut.frequency.value = this.character.inputHighCut;
    this.inputHighCut.Q.value = 0.7;

    // Post-clipping smoothing — simulates coupling capacitor between tube stages
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

    // Cabinet simulation — use real IR if available, filter chain fallback otherwise
    const irBuffer = getCachedCabIR(ampType);

    this.cabConvolver = null;
    this.cabLowpass1 = null;
    this.cabLowpass2 = null;
    this.cabBody = null;

    // Master volume
    this.masterGain = context.createGain();
    this.masterGain.gain.value = 0.7;

    // Build signal path
    this.inputNode.connect(this.inputLowCut);
    this.inputLowCut.connect(this.inputHighCut);
    this.inputHighCut.connect(this.tubePreamp.node);
    this.tubePreamp.connect(this.smoothingFilter);
    this.smoothingFilter.connect(this.postGainTrim);
    this.postGainTrim.connect(this.bassFilter);
    this.bassFilter.connect(this.midFilter);
    this.midFilter.connect(this.trebleFilter);
    this.trebleFilter.connect(this.presenceFilter);

    if (irBuffer) {
      // Real cab IR path — ConvolverNode with recorded impulse response
      this.cabConvolver = context.createConvolver();
      this.cabConvolver.buffer = irBuffer;
      this.presenceFilter.connect(this.cabConvolver);
      this.cabConvolver.connect(this.masterGain);
    } else {
      // Filter chain fallback — cascaded lowpass + body peaking
      this.cabBody = context.createBiquadFilter();
      this.cabBody.type = 'peaking';
      this.cabBody.frequency.value = this.character.cabBodyFreq;
      this.cabBody.gain.value = this.character.cabBodyGain;
      this.cabBody.Q.value = this.character.cabBodyQ;

      this.cabLowpass1 = context.createBiquadFilter();
      this.cabLowpass1.type = 'lowpass';
      this.cabLowpass1.frequency.value = this.character.cabCutoff;
      this.cabLowpass1.Q.value = this.character.cabCutoffQ;

      this.cabLowpass2 = context.createBiquadFilter();
      this.cabLowpass2.type = 'lowpass';
      this.cabLowpass2.frequency.value = this.character.cabCutoff * 1.4;
      this.cabLowpass2.Q.value = 0.5;

      this.presenceFilter.connect(this.cabBody);
      this.cabBody.connect(this.cabLowpass1);
      this.cabLowpass1.connect(this.cabLowpass2);
      this.cabLowpass2.connect(this.masterGain);
    }

    this.masterGain.connect(this.wetNode);
  }

  /**
   * Factory — creates the AudioWorkletNode then wires the signal chain.
   * Worklet module and cab IRs must already be loaded via AudioEngine.start().
   */
  static create(context: AudioContext, ampType: EffectType): AmpSimulatorEffect {
    const tubePreamp = TubePreampNode.create(context, ampType);
    return new AmpSimulatorEffect(context, tubePreamp, ampType);
  }

  setParameter(id: string, value: number): void {
    const now = this.context.currentTime;
    switch (id) {
      case 'gain':
        this.tubePreamp.setGain(value, now);
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
      case 'sag':
        this.tubePreamp.setSagAmount(value, now);
        break;
    }
  }

  dispose(): void {
    this.inputLowCut.disconnect();
    this.inputHighCut.disconnect();
    this.tubePreamp.disconnect();
    this.smoothingFilter.disconnect();
    this.postGainTrim.disconnect();
    this.bassFilter.disconnect();
    this.midFilter.disconnect();
    this.trebleFilter.disconnect();
    this.presenceFilter.disconnect();
    this.cabConvolver?.disconnect();
    this.cabBody?.disconnect();
    this.cabLowpass1?.disconnect();
    this.cabLowpass2?.disconnect();
    this.masterGain.disconnect();
    this.disposeBase();
  }
}
