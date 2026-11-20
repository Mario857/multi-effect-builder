import { EFFECT_CATEGORY, EFFECT_TYPE } from '@/types/audio';
import type { AmpType, EffectCategory } from '@/types/audio';

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

/** Accent border colour only — e.g. the outline of the selected pedal. */
export const ACCENT_BORDER_CLASSES: Record<AccentColor, string> = {
  primary: 'border-accent-primary',
  [EFFECT_CATEGORY.DISTORTION]: 'border-fx-distortion',
  [EFFECT_CATEGORY.DELAY]: 'border-fx-delay',
  [EFFECT_CATEGORY.REVERB]: 'border-fx-reverb',
  [EFFECT_CATEGORY.MODULATION]: 'border-fx-modulation',
  [EFFECT_CATEGORY.DYNAMICS]: 'border-fx-dynamics',
  [EFFECT_CATEGORY.EQ]: 'border-fx-eq',
  [EFFECT_CATEGORY.AMP]: 'border-fx-amp',
  [EFFECT_CATEGORY.UTILITY]: 'border-fx-utility',
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

/** Shared look of small form fields (text inputs, selects). */
export const FIELD_CLASSES =
  'rounded-md border border-border-default bg-bg-elevated px-2 py-1 text-xs text-text-primary';

/** `KeyboardEvent.key` values handled by slider-like controls and forms. */
export const KEYBOARD_KEY = {
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
  HOME: 'Home',
  END: 'End',
  ESCAPE: 'Escape',
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

/** Factor by which raw RMS levels are scaled up before they are drawn, so a typical guitar signal fills the meter. */
export const LEVEL_METER_DISPLAY_GAIN = 5;

/** Width in pixels of the horizontal input / output level meters. */
export const LEVEL_METER_WIDTH = 120;

/** Height in pixels of the horizontal input / output level meters. */
export const LEVEL_METER_HEIGHT = 10;

/** Lowest value the level meters' dB readouts show; a level at or below it reads as silence. */
export const LEVEL_METER_DB_FLOOR = -60;

/** dB readout of a level at or below `LEVEL_METER_DB_FLOOR`. */
export const LEVEL_METER_SILENCE_LABEL = '-inf';

/** Number of segments in the tuner's cents indicator; odd, so that one segment marks "in tune". */
export const TUNER_INDICATOR_SEGMENTS = 21;

/** Deviation in cents shown by the outermost segment of the tuner's indicator. */
export const TUNER_CENTS_RANGE = 50;

/** Number of parameters a pedal shows as knobs; the full set is in the parameter panel. */
export const PEDAL_VISIBLE_PARAMETER_COUNT = 3;

/** Longest name a user preset can be given. */
export const PRESET_NAME_MAX_LENGTH = 30;

/** Characters of a device id shown in place of the label browsers hide until microphone access is granted. */
export const DEVICE_ID_LABEL_LENGTH = 8;

/** Amp model names as shown on the amp selector chips. */
export const AMP_SHORT_LABELS: Record<AmpType, string> = {
  [EFFECT_TYPE.AMP_CLEAN]: 'Clean',
  [EFFECT_TYPE.AMP_CRUNCH]: 'Crunch',
  [EFFECT_TYPE.AMP_HIGHGAIN]: 'High Gain',
  [EFFECT_TYPE.AMP_ACOUSTIC]: 'Acoustic',
};

/** Categories offered as filters in the effect rack, in display order. */
export const EFFECT_RACK_FILTER_CATEGORIES: readonly EffectCategory[] = [
  EFFECT_CATEGORY.DISTORTION,
  EFFECT_CATEGORY.DELAY,
  EFFECT_CATEGORY.REVERB,
  EFFECT_CATEGORY.MODULATION,
  EFFECT_CATEGORY.DYNAMICS,
  EFFECT_CATEGORY.EQ,
];

/**
 * MIME type under which a dragged pedal's id is put on the drag's DataTransfer. A private
 * type keeps the drag from being droppable into text fields or other applications.
 */
export const PEDAL_DRAG_MIME_TYPE = 'application/x-multi-effect-pedal';
