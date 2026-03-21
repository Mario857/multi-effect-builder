export interface AudioDeviceInfo {
  readonly deviceId: string;
  readonly label: string;
  readonly kind: MediaDeviceKind;
}

export interface AudioEngineState {
  readonly isRunning: boolean;
  readonly sampleRate: number;
  readonly inputLevel: number;
  readonly outputLevel: number;
}

export interface AudioInputConfig {
  readonly deviceId: string;
  readonly isMonitoring: boolean;
  readonly masterVolume: number;
}

export interface TunerReading {
  readonly frequency: number;
  readonly note: string;
  readonly octave: number;
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
  NOISE_GATE: 'noise-gate',
  AMP_CLEAN: 'amp-clean',
  AMP_CRUNCH: 'amp-crunch',
  AMP_HIGHGAIN: 'amp-highgain',
  AMP_ACOUSTIC: 'amp-acoustic',
} as const;

export type EffectType = (typeof EFFECT_TYPE)[keyof typeof EFFECT_TYPE];

export interface EffectParameterDefinition {
  readonly id: string;
  readonly name: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly defaultValue: number;
  readonly unit: string;
}

export interface EffectDefinition {
  readonly type: EffectType;
  readonly name: string;
  readonly category: EffectCategory;
  readonly description: string;
  readonly parameters: readonly EffectParameterDefinition[];
}

export interface EffectParameterValue {
  readonly id: string;
  readonly value: number;
}

export interface EffectInstance {
  readonly id: string;
  readonly type: EffectType;
  readonly isBypassed: boolean;
  readonly parameters: readonly EffectParameterValue[];
}

export interface Pedalboard {
  readonly id: string;
  readonly name: string;
  readonly ampType: EffectType;
  readonly ampParameters: readonly EffectParameterValue[];
  readonly effects: readonly EffectInstance[];
}

export interface Preset {
  readonly id: string;
  readonly name: string;
  readonly pedalboard: Pedalboard;
  readonly isFactory: boolean;
}
