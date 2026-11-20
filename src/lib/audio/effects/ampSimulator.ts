import { EffectNode } from '@/lib/audio/effectNode';
import { createBiquadFilter } from '@/lib/audio/filterUtils';
import { TubePreampNode } from '@/lib/audio/worklets/tubePreampNode';
import { getCachedCabIR } from '@/lib/audio/cabImpulseResponse';
import { BUTTERWORTH_Q } from '@/lib/constants/dsp';
import { EFFECT_DEFINITIONS } from '@/lib/constants/effects';
import type { AmpType } from '@/types/audio';
import { EFFECT_TYPE } from '@/types/audio';

// Input highpass — keeps rumble and hum out of the gain stages
const INPUT_LOWCUT_FREQUENCY = 100;
// Very low Q gives the inter-stage smoothing lowpass a gentle, gradual roll-off
const SMOOTHING_Q = 0.35;
const PRESENCE_Q = 1.0;
// Fallback cabinet: second lowpass sits above the first to steepen the roll-off
const CAB_SECOND_LOWPASS_FREQUENCY_RATIO = 1.4;
const CAB_SECOND_LOWPASS_Q = 0.5;

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

const AMP_CHARACTERS: Readonly<Record<AmpType, AmpCharacter>> = {
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

/**
 * Guitar amp model: input filtering → tube preamp/power amp worklet →
 * tone stack → cabinet simulation → master volume.
 */
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

  /**
   * Use AmpSimulatorEffect.create() instead — the worklet module must be
   * registered on the AudioContext before constructing the node.
   */
  private constructor(context: AudioContext, ampType: AmpType) {
    super(context);

    const character = AMP_CHARACTERS[ampType];
    this.tubePreamp = new TubePreampNode(context, ampType);

    // Input filtering — tight bandpass before any amplification
    this.inputLowCut = createBiquadFilter(context, {
      type: 'highpass',
      frequency: INPUT_LOWCUT_FREQUENCY,
      q: BUTTERWORTH_Q,
    });
    this.inputHighCut = createBiquadFilter(context, {
      type: 'lowpass',
      frequency: character.inputHighCut,
      q: BUTTERWORTH_Q,
    });

    // Post-clipping smoothing — simulates coupling capacitor between tube stages
    this.smoothingFilter = createBiquadFilter(context, {
      type: 'lowpass',
      frequency: character.smoothingCutoff,
      q: SMOOTHING_Q,
    });

    // Post-gain trim — per amp type to normalize output levels
    this.postGainTrim = context.createGain();
    this.postGainTrim.gain.value = character.postTrim;

    // Tone stack
    this.bassFilter = createBiquadFilter(context, {
      type: 'lowshelf',
      frequency: character.bassFreq,
    });
    this.midFilter = createBiquadFilter(context, {
      type: 'peaking',
      frequency: character.midFreq,
      q: character.midQ,
    });
    this.trebleFilter = createBiquadFilter(context, {
      type: 'highshelf',
      frequency: character.trebleFreq,
    });
    this.presenceFilter = createBiquadFilter(context, {
      type: 'peaking',
      frequency: character.presenceFreq,
      q: PRESENCE_Q,
    });

    // Cabinet simulation — use real IR if available, filter chain fallback otherwise
    const irBuffer = getCachedCabIR(ampType);

    this.cabConvolver = null;
    this.cabLowpass1 = null;
    this.cabLowpass2 = null;
    this.cabBody = null;

    // Master volume
    this.masterGain = context.createGain();

    // Build signal path
    this.inputNode.connect(this.inputLowCut);
    this.inputLowCut.connect(this.inputHighCut);
    this.inputHighCut.connect(this.tubePreamp.node);
    this.tubePreamp.node.connect(this.smoothingFilter);
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
      this.cabBody = createBiquadFilter(context, {
        type: 'peaking',
        frequency: character.cabBodyFreq,
        q: character.cabBodyQ,
        gain: character.cabBodyGain,
      });
      this.cabLowpass1 = createBiquadFilter(context, {
        type: 'lowpass',
        frequency: character.cabCutoff,
        q: character.cabCutoffQ,
      });
      this.cabLowpass2 = createBiquadFilter(context, {
        type: 'lowpass',
        frequency: character.cabCutoff * CAB_SECOND_LOWPASS_FREQUENCY_RATIO,
        q: CAB_SECOND_LOWPASS_Q,
      });

      this.presenceFilter.connect(this.cabBody);
      this.cabBody.connect(this.cabLowpass1);
      this.cabLowpass1.connect(this.cabLowpass2);
      this.cabLowpass2.connect(this.masterGain);
    }

    this.masterGain.connect(this.wetNode);

    this.applyDefaults(EFFECT_DEFINITIONS[ampType]);
  }

  /**
   * Factory — creates the tube preamp worklet node and wires the signal chain.
   * Worklet module and cab IRs must already be loaded via AudioEngine.start().
   */
  static create(context: AudioContext, ampType: AmpType): AmpSimulatorEffect {
    return new AmpSimulatorEffect(context, ampType);
  }

  protected applyParameter(id: string, value: number): void {
    switch (id) {
      case 'gain':
        this.setParam(this.tubePreamp.gain, value);
        break;
      case 'bass':
        this.setParam(this.bassFilter.gain, value);
        break;
      case 'mid':
        this.setParam(this.midFilter.gain, value);
        break;
      case 'treble':
        this.setParam(this.trebleFilter.gain, value);
        break;
      case 'presence':
        this.setParam(this.presenceFilter.gain, value);
        break;
      case 'master':
        this.setParam(this.masterGain.gain, value);
        break;
      case 'sag':
        this.setParam(this.tubePreamp.sagAmount, value);
        break;
    }
  }

  dispose(): void {
    this.inputLowCut.disconnect();
    this.inputHighCut.disconnect();
    this.tubePreamp.dispose();
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
