import { EFFECT_TYPE } from '@/types/audio';
import type { AmpType } from '@/types/audio';

/** Processor name registered in the AudioWorklet scope. */
export const TUBE_PREAMP_PROCESSOR_NAME = 'tube-preamp-processor';

/** Amp type indices — must match public/worklets/tube-preamp-processor.js. */
export const AMP_TYPE_INDEX: Readonly<Record<AmpType, number>> = {
  [EFFECT_TYPE.AMP_CLEAN]: 0,
  [EFFECT_TYPE.AMP_CRUNCH]: 1,
  [EFFECT_TYPE.AMP_HIGHGAIN]: 2,
  [EFFECT_TYPE.AMP_ACOUSTIC]: 3,
};

/** AudioParam names — must match the processor's `parameterDescriptors`. */
export const TUBE_PREAMP_PARAM = {
  GAIN: 'gain',
  SAG_AMOUNT: 'sagAmount',
} as const;
