import type { EffectDefinition } from '@/types/audio';
import { EFFECT_CATEGORY, EFFECT_TYPE } from '@/types/audio';

export const DISTORTION_DEFINITION: EffectDefinition = {
  type: EFFECT_TYPE.DISTORTION,
  name: 'Distortion',
  category: EFFECT_CATEGORY.DISTORTION,
  description: 'Overdrive and distortion with multiple clipping modes',
  parameters: [
    { id: 'drive', name: 'Drive', min: 0, max: 1, step: 0.01, defaultValue: 0.5, unit: '' },
    { id: 'tone', name: 'Tone', min: 200, max: 8000, step: 1, defaultValue: 3000, unit: 'Hz' },
    { id: 'level', name: 'Level', min: 0, max: 1, step: 0.01, defaultValue: 0.7, unit: '' },
    { id: 'mix', name: 'Mix', min: 0, max: 1, step: 0.01, defaultValue: 1, unit: '' },
  ],
};

export const DELAY_DEFINITION: EffectDefinition = {
  type: EFFECT_TYPE.DELAY,
  name: 'Delay',
  category: EFFECT_CATEGORY.DELAY,
  description: 'Digital delay with feedback control',
  parameters: [
    { id: 'time', name: 'Time', min: 0.01, max: 2, step: 0.01, defaultValue: 0.4, unit: 's' },
    { id: 'feedback', name: 'Feedback', min: 0, max: 0.95, step: 0.01, defaultValue: 0.4, unit: '' },
    { id: 'mix', name: 'Mix', min: 0, max: 1, step: 0.01, defaultValue: 0.3, unit: '' },
    { id: 'tone', name: 'Tone', min: 200, max: 8000, step: 1, defaultValue: 4000, unit: 'Hz' },
  ],
};

export const REVERB_DEFINITION: EffectDefinition = {
  type: EFFECT_TYPE.REVERB,
  name: 'Reverb',
  category: EFFECT_CATEGORY.REVERB,
  description: 'Convolution reverb with adjustable room size',
  parameters: [
    { id: 'decay', name: 'Decay', min: 0.1, max: 10, step: 0.1, defaultValue: 2.5, unit: 's' },
    { id: 'size', name: 'Size', min: 0, max: 1, step: 0.01, defaultValue: 0.5, unit: '' },
    { id: 'mix', name: 'Mix', min: 0, max: 1, step: 0.01, defaultValue: 0.3, unit: '' },
    { id: 'damping', name: 'Damping', min: 0, max: 1, step: 0.01, defaultValue: 0.5, unit: '' },
  ],
};

export const CHORUS_DEFINITION: EffectDefinition = {
  type: EFFECT_TYPE.CHORUS,
  name: 'Chorus',
  category: EFFECT_CATEGORY.MODULATION,
  description: 'Lush chorus with rate and depth control',
  parameters: [
    { id: 'rate', name: 'Rate', min: 0.1, max: 10, step: 0.1, defaultValue: 1.5, unit: 'Hz' },
    { id: 'depth', name: 'Depth', min: 0, max: 1, step: 0.01, defaultValue: 0.5, unit: '' },
    { id: 'mix', name: 'Mix', min: 0, max: 1, step: 0.01, defaultValue: 0.5, unit: '' },
    { id: 'delay', name: 'Delay', min: 0.002, max: 0.05, step: 0.001, defaultValue: 0.01, unit: 's' },
  ],
};

export const COMPRESSOR_DEFINITION: EffectDefinition = {
  type: EFFECT_TYPE.COMPRESSOR,
  name: 'Compressor',
  category: EFFECT_CATEGORY.DYNAMICS,
  description: 'Dynamic range compression with full parameter control',
  parameters: [
    { id: 'threshold', name: 'Threshold', min: -60, max: 0, step: 1, defaultValue: -24, unit: 'dB' },
    { id: 'ratio', name: 'Ratio', min: 1, max: 20, step: 0.5, defaultValue: 4, unit: ':1' },
    { id: 'attack', name: 'Attack', min: 0, max: 0.5, step: 0.001, defaultValue: 0.003, unit: 's' },
    { id: 'release', name: 'Release', min: 0.01, max: 1, step: 0.01, defaultValue: 0.25, unit: 's' },
    { id: 'knee', name: 'Knee', min: 0, max: 40, step: 1, defaultValue: 8, unit: 'dB' },
  ],
};

export const EQ_DEFINITION: EffectDefinition = {
  type: EFFECT_TYPE.EQ,
  name: 'Equalizer',
  category: EFFECT_CATEGORY.EQ,
  description: 'Three-band parametric equalizer',
  parameters: [
    { id: 'lowGain', name: 'Low', min: -12, max: 12, step: 0.5, defaultValue: 0, unit: 'dB' },
    { id: 'lowFreq', name: 'Low Freq', min: 60, max: 500, step: 1, defaultValue: 200, unit: 'Hz' },
    { id: 'midGain', name: 'Mid', min: -12, max: 12, step: 0.5, defaultValue: 0, unit: 'dB' },
    { id: 'midFreq', name: 'Mid Freq', min: 300, max: 5000, step: 1, defaultValue: 1000, unit: 'Hz' },
    { id: 'highGain', name: 'High', min: -12, max: 12, step: 0.5, defaultValue: 0, unit: 'dB' },
    { id: 'highFreq', name: 'High Freq', min: 2000, max: 12000, step: 1, defaultValue: 5000, unit: 'Hz' },
  ],
};

export const TREMOLO_DEFINITION: EffectDefinition = {
  type: EFFECT_TYPE.TREMOLO,
  name: 'Tremolo',
  category: EFFECT_CATEGORY.MODULATION,
  description: 'Volume modulation with variable waveform',
  parameters: [
    { id: 'rate', name: 'Rate', min: 0.5, max: 15, step: 0.1, defaultValue: 5, unit: 'Hz' },
    { id: 'depth', name: 'Depth', min: 0, max: 1, step: 0.01, defaultValue: 0.6, unit: '' },
    { id: 'mix', name: 'Mix', min: 0, max: 1, step: 0.01, defaultValue: 1, unit: '' },
  ],
};

export const PHASER_DEFINITION: EffectDefinition = {
  type: EFFECT_TYPE.PHASER,
  name: 'Phaser',
  category: EFFECT_CATEGORY.MODULATION,
  description: 'Phase-shifting effect with adjustable stages',
  parameters: [
    { id: 'rate', name: 'Rate', min: 0.1, max: 10, step: 0.1, defaultValue: 0.8, unit: 'Hz' },
    { id: 'depth', name: 'Depth', min: 0, max: 1, step: 0.01, defaultValue: 0.7, unit: '' },
    { id: 'feedback', name: 'Feedback', min: 0, max: 0.95, step: 0.01, defaultValue: 0.4, unit: '' },
    { id: 'mix', name: 'Mix', min: 0, max: 1, step: 0.01, defaultValue: 0.5, unit: '' },
  ],
};

export const NOISE_GATE_DEFINITION: EffectDefinition = {
  type: EFFECT_TYPE.NOISE_GATE,
  name: 'Noise Gate',
  category: EFFECT_CATEGORY.DYNAMICS,
  description: 'Reduces noise below a set threshold',
  parameters: [
    { id: 'threshold', name: 'Threshold', min: -80, max: -10, step: 1, defaultValue: -45, unit: 'dB' },
    { id: 'attack', name: 'Attack', min: 0, max: 0.1, step: 0.001, defaultValue: 0.005, unit: 's' },
    { id: 'release', name: 'Release', min: 0.01, max: 0.5, step: 0.01, defaultValue: 0.1, unit: 's' },
  ],
};

const AMP_SHARED_PARAMETERS = [
  { id: 'gain', name: 'Gain', min: 0, max: 1, step: 0.01, defaultValue: 0.5, unit: '' },
  { id: 'bass', name: 'Bass', min: -12, max: 12, step: 0.5, defaultValue: 0, unit: 'dB' },
  { id: 'mid', name: 'Mid', min: -12, max: 12, step: 0.5, defaultValue: 0, unit: 'dB' },
  { id: 'treble', name: 'Treble', min: -12, max: 12, step: 0.5, defaultValue: 0, unit: 'dB' },
  { id: 'presence', name: 'Presence', min: -12, max: 12, step: 0.5, defaultValue: 0, unit: 'dB' },
  { id: 'master', name: 'Master', min: 0, max: 1, step: 0.01, defaultValue: 0.7, unit: '' },
] as const;

export const AMP_CLEAN_DEFINITION: EffectDefinition = {
  type: EFFECT_TYPE.AMP_CLEAN,
  name: 'Clean Amp',
  category: EFFECT_CATEGORY.AMP,
  description: 'Fender-style clean amp with bright sparkle',
  parameters: AMP_SHARED_PARAMETERS,
};

export const AMP_CRUNCH_DEFINITION: EffectDefinition = {
  type: EFFECT_TYPE.AMP_CRUNCH,
  name: 'Crunch Amp',
  category: EFFECT_CATEGORY.AMP,
  description: 'Marshall-style crunch with mid-forward response',
  parameters: AMP_SHARED_PARAMETERS,
};

export const AMP_HIGHGAIN_DEFINITION: EffectDefinition = {
  type: EFFECT_TYPE.AMP_HIGHGAIN,
  name: 'High Gain Amp',
  category: EFFECT_CATEGORY.AMP,
  description: 'Mesa-style high gain with tight low end',
  parameters: AMP_SHARED_PARAMETERS,
};

export const AMP_ACOUSTIC_DEFINITION: EffectDefinition = {
  type: EFFECT_TYPE.AMP_ACOUSTIC,
  name: 'Acoustic Sim',
  category: EFFECT_CATEGORY.AMP,
  description: 'Acoustic guitar simulation with body resonance',
  parameters: AMP_SHARED_PARAMETERS,
};

export const EFFECT_DEFINITIONS: Record<string, EffectDefinition> = {
  [EFFECT_TYPE.DISTORTION]: DISTORTION_DEFINITION,
  [EFFECT_TYPE.DELAY]: DELAY_DEFINITION,
  [EFFECT_TYPE.REVERB]: REVERB_DEFINITION,
  [EFFECT_TYPE.CHORUS]: CHORUS_DEFINITION,
  [EFFECT_TYPE.COMPRESSOR]: COMPRESSOR_DEFINITION,
  [EFFECT_TYPE.EQ]: EQ_DEFINITION,
  [EFFECT_TYPE.TREMOLO]: TREMOLO_DEFINITION,
  [EFFECT_TYPE.PHASER]: PHASER_DEFINITION,
  [EFFECT_TYPE.NOISE_GATE]: NOISE_GATE_DEFINITION,
  [EFFECT_TYPE.AMP_CLEAN]: AMP_CLEAN_DEFINITION,
  [EFFECT_TYPE.AMP_CRUNCH]: AMP_CRUNCH_DEFINITION,
  [EFFECT_TYPE.AMP_HIGHGAIN]: AMP_HIGHGAIN_DEFINITION,
  [EFFECT_TYPE.AMP_ACOUSTIC]: AMP_ACOUSTIC_DEFINITION,
};

export const PEDAL_EFFECT_TYPES = [
  EFFECT_TYPE.DISTORTION,
  EFFECT_TYPE.DELAY,
  EFFECT_TYPE.REVERB,
  EFFECT_TYPE.CHORUS,
  EFFECT_TYPE.COMPRESSOR,
  EFFECT_TYPE.EQ,
  EFFECT_TYPE.TREMOLO,
  EFFECT_TYPE.PHASER,
  EFFECT_TYPE.NOISE_GATE,
] as const;

export const AMP_TYPES = [
  EFFECT_TYPE.AMP_CLEAN,
  EFFECT_TYPE.AMP_CRUNCH,
  EFFECT_TYPE.AMP_HIGHGAIN,
  EFFECT_TYPE.AMP_ACOUSTIC,
] as const;
