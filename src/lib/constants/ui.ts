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

export const KNOB_SIZE_XS = 28;
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

/** Accent a shared component can be tinted with: the app accent or an effect category colour. */
export type AccentColor = 'primary' | EffectCategory;

/** Filled accent look (accent background, inverse text) — e.g. the active amp-model chip. */
export const ACCENT_SOLID_CLASSES: Record<AccentColor, string> = {
  primary: 'bg-accent-primary text-text-inverse',
  [EFFECT_CATEGORY.DISTORTION]: 'bg-fx-distortion text-text-inverse',
  [EFFECT_CATEGORY.DELAY]: 'bg-fx-delay text-text-inverse',
  [EFFECT_CATEGORY.REVERB]: 'bg-fx-reverb text-text-inverse',
  [EFFECT_CATEGORY.MODULATION]: 'bg-fx-modulation text-text-inverse',
  [EFFECT_CATEGORY.DYNAMICS]: 'bg-fx-dynamics text-text-inverse',
  [EFFECT_CATEGORY.EQ]: 'bg-fx-eq text-text-inverse',
  [EFFECT_CATEGORY.AMP]: 'bg-fx-amp text-text-inverse',
  [EFFECT_CATEGORY.UTILITY]: 'bg-fx-utility text-text-inverse',
};

/** Tinted accent look (10% accent background, accent text) — e.g. the active category filter chip. */
export const ACCENT_SOFT_CLASSES: Record<AccentColor, string> = {
  primary: 'bg-accent-primary/10 text-accent-primary',
  [EFFECT_CATEGORY.DISTORTION]: 'bg-fx-distortion/10 text-fx-distortion',
  [EFFECT_CATEGORY.DELAY]: 'bg-fx-delay/10 text-fx-delay',
  [EFFECT_CATEGORY.REVERB]: 'bg-fx-reverb/10 text-fx-reverb',
  [EFFECT_CATEGORY.MODULATION]: 'bg-fx-modulation/10 text-fx-modulation',
  [EFFECT_CATEGORY.DYNAMICS]: 'bg-fx-dynamics/10 text-fx-dynamics',
  [EFFECT_CATEGORY.EQ]: 'bg-fx-eq/10 text-fx-eq',
  [EFFECT_CATEGORY.AMP]: 'bg-fx-amp/10 text-fx-amp',
  [EFFECT_CATEGORY.UTILITY]: 'bg-fx-utility/10 text-fx-utility',
};

/** Accent text colour only — e.g. a card title tinted with its category. */
export const ACCENT_TEXT_CLASSES: Record<AccentColor, string> = {
  primary: 'text-accent-primary',
  [EFFECT_CATEGORY.DISTORTION]: 'text-fx-distortion',
  [EFFECT_CATEGORY.DELAY]: 'text-fx-delay',
  [EFFECT_CATEGORY.REVERB]: 'text-fx-reverb',
  [EFFECT_CATEGORY.MODULATION]: 'text-fx-modulation',
  [EFFECT_CATEGORY.DYNAMICS]: 'text-fx-dynamics',
  [EFFECT_CATEGORY.EQ]: 'text-fx-eq',
  [EFFECT_CATEGORY.AMP]: 'text-fx-amp',
  [EFFECT_CATEGORY.UTILITY]: 'text-fx-utility',
};

/** Visible keyboard focus ring shared by every interactive element. */
export const FOCUS_RING_CLASSES =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary';

/** Standard transition for interactive elements. */
export const INTERACTIVE_TRANSITION_CLASSES = 'transition-all duration-150 ease-out';

/** Standard look of a disabled control. */
export const DISABLED_CLASSES = 'disabled:opacity-50 disabled:pointer-events-none';

/** Typography of a section / card title. */
export const SECTION_TITLE_CLASSES = 'text-xs font-bold uppercase tracking-wider';

/** `KeyboardEvent.key` values handled by slider-like controls. */
export const KEYBOARD_KEY = {
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
  HOME: 'Home',
  END: 'End',
} as const;

/** Step of a knob or slider whose caller does not pass one. */
export const DEFAULT_CONTROL_STEP = 0.01;

/** Vertical pointer travel, in CSS pixels, that sweeps a knob across its whole range. */
export const KNOB_DRAG_RANGE_PX = 200;

/** An arrow key moves a knob by 1/Nth of its range (never less than one step; Shift = exactly one step). */
export const KNOB_KEYBOARD_STEPS = 100;

/** PageUp / PageDown move a knob by 1/Nth of its range (never less than one step). */
export const KNOB_KEYBOARD_PAGE_STEPS = 10;

/** Upper bound when deriving how many decimals a knob step needs. */
export const KNOB_MAX_DECIMALS = 6;

/** Values at or above this are displayed in thousands with a `k` suffix (3000 → 3.0k). */
export const KNOB_KILO_THRESHOLD = 1000;

/** Decimals shown for `k`-suffixed knob values. */
export const KNOB_KILO_DECIMALS = 1;

/** Distance in pixels between the knob cap edge and the centre line of its value arc. */
export const KNOB_ARC_GAP = 4;

/** Space in pixels reserved on each side of the knob cap for the value arc. */
export const KNOB_ARC_MARGIN = 6;

/** Stroke width of the knob value arc. */
export const KNOB_ARC_STROKE_WIDTH = 2.5;

/** SVG angles start at 3 o'clock; knob rotation is measured from 12 o'clock. */
export const KNOB_ARC_ANGLE_OFFSET = -90;

/** Width in pixels of the knob pointer line. */
export const KNOB_INDICATOR_WIDTH = 3;

/** Knob pointer length as a fraction of the knob diameter. */
export const KNOB_INDICATOR_LENGTH_RATIO = 0.3;

/** Gap between the knob edge and its pointer as a fraction of the knob diameter. */
export const KNOB_INDICATOR_INSET_RATIO = 0.1;

/** Number of segments in a VU meter. */
export const VU_METER_SEGMENTS = 20;

/** Segments from this fraction of the meter upwards use the mid (warning) colour. */
export const VU_METER_MID_THRESHOLD = 0.6;

/** Segments from this fraction of the meter upwards use the high (clipping) colour. */
export const VU_METER_HIGH_THRESHOLD = 0.85;

/** Default VU meter width in pixels. */
export const VU_METER_DEFAULT_WIDTH = 12;

/** Default VU meter height in pixels. */
export const VU_METER_DEFAULT_HEIGHT = 80;

/** Upper bound of the `aria-valuenow` a VU meter reports (percent). */
export const VU_METER_ARIA_MAX = 100;
