import type { EffectParameterValue, EffectType } from '@/types/audio';
import { EFFECT_DEFINITIONS } from '@/lib/constants/effects';

/**
 * Builds the default parameter values for an effect or amp type from its definition.
 * @param type - The effect or amp type
 * @returns One value per defined parameter, in definition order
 */
export function getDefaultParameters(type: EffectType): readonly EffectParameterValue[] {
  return EFFECT_DEFINITIONS[type].parameters.map((param) => ({
    id: param.id,
    value: param.defaultValue,
  }));
}
