import { EFFECT_CATEGORY } from '@/types/audio';
import type { EffectCategory } from '@/types/audio';

export const CATEGORY_COLORS: Record<EffectCategory, string> = {
  [EFFECT_CATEGORY.DISTORTION]: 'text-fx-distortion border-fx-distortion',
  [EFFECT_CATEGORY.DELAY]: 'text-fx-delay border-fx-delay',
  [EFFECT_CATEGORY.REVERB]: 'text-fx-reverb border-fx-reverb',
  [EFFECT_CATEGORY.MODULATION]: 'text-fx-modulation border-fx-modulation',
  [EFFECT_CATEGORY.DYNAMICS]: 'text-fx-dynamics border-fx-dynamics',
  [EFFECT_CATEGORY.EQ]: 'text-fx-eq border-fx-eq',
  [EFFECT_CATEGORY.AMP]: 'text-fx-amp border-fx-amp',
  [EFFECT_CATEGORY.UTILITY]: 'text-fx-utility border-fx-utility',
};

export const CATEGORY_BG_COLORS: Record<EffectCategory, string> = {
  [EFFECT_CATEGORY.DISTORTION]: 'bg-fx-distortion/10',
  [EFFECT_CATEGORY.DELAY]: 'bg-fx-delay/10',
  [EFFECT_CATEGORY.REVERB]: 'bg-fx-reverb/10',
  [EFFECT_CATEGORY.MODULATION]: 'bg-fx-modulation/10',
  [EFFECT_CATEGORY.DYNAMICS]: 'bg-fx-dynamics/10',
  [EFFECT_CATEGORY.EQ]: 'bg-fx-eq/10',
  [EFFECT_CATEGORY.AMP]: 'bg-fx-amp/10',
  [EFFECT_CATEGORY.UTILITY]: 'bg-fx-utility/10',
};

export const CATEGORY_LABELS: Record<EffectCategory, string> = {
  [EFFECT_CATEGORY.DISTORTION]: 'Distortion',
  [EFFECT_CATEGORY.DELAY]: 'Delay',
  [EFFECT_CATEGORY.REVERB]: 'Reverb',
  [EFFECT_CATEGORY.MODULATION]: 'Modulation',
  [EFFECT_CATEGORY.DYNAMICS]: 'Dynamics',
  [EFFECT_CATEGORY.EQ]: 'EQ / Filter',
  [EFFECT_CATEGORY.AMP]: 'Amplifier',
  [EFFECT_CATEGORY.UTILITY]: 'Utility',
};

export const KNOB_SIZE_SM = 40;
export const KNOB_SIZE_MD = 56;
export const KNOB_SIZE_LG = 72;

export const KNOB_ROTATION_RANGE = 270;
export const KNOB_ROTATION_OFFSET = -135;

export const PEDAL_MIN_WIDTH = 180;
export const PEDAL_MIN_HEIGHT = 240;

export const AMP_PANEL_HEIGHT = 200;

export const SIGNAL_CHAIN_GAP = 16;
export const CONNECTION_LINE_WIDTH = 2;
