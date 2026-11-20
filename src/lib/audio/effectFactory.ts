import type { AmpType, EffectType, EffectParameterValue, PedalEffectType } from '@/types/audio';
import { EFFECT_TYPE } from '@/types/audio';
import { AMP_TYPES, EFFECT_DEFINITIONS } from '@/lib/constants/effects';
import { EffectNode } from '@/lib/audio/effectNode';
import { DistortionEffect } from '@/lib/audio/effects/distortion';
import { DelayEffect } from '@/lib/audio/effects/delay';
import { ReverbEffect } from '@/lib/audio/effects/reverb';
import { ChorusEffect } from '@/lib/audio/effects/chorus';
import { CompressorEffect } from '@/lib/audio/effects/compressor';
import { EqualizerEffect } from '@/lib/audio/effects/equalizer';
import { TremoloEffect } from '@/lib/audio/effects/tremolo';
import { PhaserEffect } from '@/lib/audio/effects/phaser';
import { FuzzEffect } from '@/lib/audio/effects/fuzz';
import { NoiseGateEffect } from '@/lib/audio/effects/noiseGate';
import { AmpSimulatorEffect } from '@/lib/audio/effects/ampSimulator';

type EffectConstructor = new (context: AudioContext) => EffectNode;

const EFFECT_REGISTRY: Record<PedalEffectType, EffectConstructor> = {
  [EFFECT_TYPE.DISTORTION]: DistortionEffect,
  [EFFECT_TYPE.DELAY]: DelayEffect,
  [EFFECT_TYPE.REVERB]: ReverbEffect,
  [EFFECT_TYPE.CHORUS]: ChorusEffect,
  [EFFECT_TYPE.COMPRESSOR]: CompressorEffect,
  [EFFECT_TYPE.EQ]: EqualizerEffect,
  [EFFECT_TYPE.TREMOLO]: TremoloEffect,
  [EFFECT_TYPE.PHASER]: PhaserEffect,
  [EFFECT_TYPE.FUZZ]: FuzzEffect,
  [EFFECT_TYPE.NOISE_GATE]: NoiseGateEffect,
};

const AMP_TYPES_SET: ReadonlySet<EffectType> = new Set(AMP_TYPES);

export function isAmpType(type: EffectType): type is AmpType {
  return AMP_TYPES_SET.has(type);
}

export function createEffectNode(context: AudioContext, type: EffectType): EffectNode {
  if (isAmpType(type)) {
    return AmpSimulatorEffect.create(context, type);
  }

  const Constructor = EFFECT_REGISTRY[type];
  return new Constructor(context);
}

export function getDefaultParameters(type: EffectType): readonly EffectParameterValue[] {
  const definition = EFFECT_DEFINITIONS[type];
  if (!definition) return [];

  return definition.parameters.map((param) => ({
    id: param.id,
    value: param.defaultValue,
  }));
}
