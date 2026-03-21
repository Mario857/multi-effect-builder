import { EFFECT_TYPE } from '@/types/audio';
import type { EffectType } from '@/types/audio';

// Processor name registered in the AudioWorklet scope
export const TUBE_PREAMP_PROCESSOR_NAME = 'tube-preamp-processor';

// Amp type indices — must match public/worklets/tube-preamp-processor.js
export const AMP_TYPE_INDEX = {
  [EFFECT_TYPE.AMP_CLEAN]: 0,
  [EFFECT_TYPE.AMP_CRUNCH]: 1,
  [EFFECT_TYPE.AMP_HIGHGAIN]: 2,
  [EFFECT_TYPE.AMP_ACOUSTIC]: 3,
} as const;

export type AmpTypeIndex = (typeof AMP_TYPE_INDEX)[keyof typeof AMP_TYPE_INDEX];

export function getAmpTypeIndex(ampType: EffectType): AmpTypeIndex {
  const index = AMP_TYPE_INDEX[ampType as keyof typeof AMP_TYPE_INDEX];
  return index ?? AMP_TYPE_INDEX[EFFECT_TYPE.AMP_CLEAN];
}
