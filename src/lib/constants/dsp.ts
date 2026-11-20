/**
 * Time constant (seconds) of the exponential glide applied to every smoothed
 * AudioParam change. The glide is ~98% complete after four time constants
 * (20 ms) — fast enough to feel immediate, slow enough to avoid zipper clicks.
 */
export const PARAM_SMOOTHING_TIME_CONSTANT = 0.005;

/** Frames per Web Audio render quantum — the block size the audio thread processes at once. */
export const RENDER_QUANTUM_FRAMES = 128;

/** Q of a maximally flat (Butterworth) second-order filter — no resonant peak at the cutoff. */
export const BUTTERWORTH_Q = Math.SQRT1_2;

/** Gain of a fully open signal path. */
export const UNITY_GAIN = 1;

/** Gain of a fully closed signal path. */
export const SILENT_GAIN = 0;

/**
 * Length of generated WaveShaper curves. WaveShaperNode interpolates linearly
 * between points, so a few thousand are plenty even for the steepest fuzz curve,
 * and the curve stays cheap to rebuild while a drive knob is being dragged.
 * Odd on purpose: the centre sample then maps exactly to zero input, so silence
 * in gives silence out instead of an interpolated DC offset.
 */
export const WAVESHAPER_CURVE_SAMPLES = 4097;

/** Oversampling used by every WaveShaper stage to keep clipping aliasing down. */
export const WAVESHAPER_OVERSAMPLE: OverSampleType = '4x';

/**
 * Message type that tells an AudioWorklet processor its node was disposed, so
 * it stops requesting render callbacks and can be garbage collected.
 * Must match the processors in public/worklets/.
 */
export const WORKLET_DISPOSE_MESSAGE_TYPE = 'dispose';
