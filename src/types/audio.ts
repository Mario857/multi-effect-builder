/** A detected pitch mapped onto the nearest equal-tempered note. */
export interface TunerReading {
  /** Detected fundamental in Hz, rounded to the tuner's display precision. */
  readonly frequency: number;
  readonly note: string;
  readonly octave: number;
  /** Signed deviation from the nearest note in whole cents (-50..50). */
  readonly centsOff: number;
}

export const EFFECT_CATEGORY = {
  DISTORTION: 'distortion',
  DELAY: 'delay',
  REVERB: 'reverb',
  MODULATION: 'modulation',
  DYNAMICS: 'dynamics',
  EQ: 'eq',
  AMP: 'amp',
  UTILITY: 'utility',
} as const;

export type EffectCategory = (typeof EFFECT_CATEGORY)[keyof typeof EFFECT_CATEGORY];

export const EFFECT_TYPE = {
  DISTORTION: 'distortion',
  DELAY: 'delay',
  REVERB: 'reverb',
  CHORUS: 'chorus',
  COMPRESSOR: 'compressor',
  EQ: 'eq',
  TREMOLO: 'tremolo',
  PHASER: 'phaser',
  FUZZ: 'fuzz',
  NOISE_GATE: 'noise-gate',
  AMP_CLEAN: 'amp-clean',
  AMP_CRUNCH: 'amp-crunch',
  AMP_HIGHGAIN: 'amp-highgain',
  AMP_ACOUSTIC: 'amp-acoustic',
} as const;

export type EffectType = (typeof EFFECT_TYPE)[keyof typeof EFFECT_TYPE];

/** Effect types that are amp models — exactly one is active at the head of the chain. */
export type AmpType =
  | typeof EFFECT_TYPE.AMP_CLEAN
  | typeof EFFECT_TYPE.AMP_CRUNCH
  | typeof EFFECT_TYPE.AMP_HIGHGAIN
  | typeof EFFECT_TYPE.AMP_ACOUSTIC;

/** Effect types that can be placed on the pedalboard (everything except amp models). */
export type PedalEffectType = Exclude<EffectType, AmpType>;

export interface EffectParameterDefinition {
  readonly id: string;
  readonly name: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly defaultValue: number;
  readonly unit: string;
}

/**
 * Static description of an effect. The type parameter ties a definition to its
 * own effect type, so looking one up by a pedal type yields a pedal definition.
 */
export interface EffectDefinition<T extends EffectType = EffectType> {
  readonly type: T;
  readonly name: string;
  readonly category: EffectCategory;
  readonly description: string;
  readonly parameters: readonly EffectParameterDefinition[];
}

export interface EffectParameterValue {
  readonly id: string;
  readonly value: number;
}

/** One pedal on the board. Amp models never appear here — the amp is a separate slot. */
export interface EffectInstance {
  readonly id: string;
  readonly type: PedalEffectType;
  readonly isBypassed: boolean;
  readonly parameters: readonly EffectParameterValue[];
}

/** The part of a pedalboard that determines the sound: the amp and the ordered effect chain. */
export interface PedalboardSignalPath {
  readonly ampType: AmpType;
  readonly ampParameters: readonly EffectParameterValue[];
  readonly effects: readonly EffectInstance[];
}

/** A named, identifiable signal path as stored inside a preset. */
export interface Pedalboard extends PedalboardSignalPath {
  readonly id: string;
  readonly name: string;
}

export interface Preset {
  readonly id: string;
  readonly name: string;
  readonly pedalboard: Pedalboard;
  readonly isFactory: boolean;
}

/** The slice of the pedalboard store that is written to localStorage. */
export interface PersistedPedalboard extends PedalboardSignalPath {
  /** User presets only — factory presets are constants and are re-added on load. */
  readonly presets: readonly Preset[];
  readonly activePresetId: string | null;
}
