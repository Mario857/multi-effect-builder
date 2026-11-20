/**
 * Minimum time span of the input/output analysers. The tuner needs two full periods
 * of its lowest note (2 / 60 Hz ≈ 33 ms) to find the pitch by autocorrelation; the
 * analyser size is derived from this and the context's sample rate, so a 96 kHz
 * interface gets a proportionally larger window (2048 samples at 44.1/48 kHz).
 */
export const ANALYSER_WINDOW_SECONDS = 0.04;

export const SMOOTHING_TIME_CONSTANT = 0.8;

export const MASTER_VOLUME_DEFAULT = 0.75;

export const MASTER_VOLUME_MIN = 0;

export const MASTER_VOLUME_MAX = 1;

/** Linear gain that passes a signal unchanged. */
export const GAIN_UNITY = 1;

/** Linear gain that mutes a signal. */
export const GAIN_SILENT = 0;

/**
 * Time constant of the exponential glide used for engine-level gain changes
 * (master volume, monitor mute). The gain covers ~98% of a change within four
 * time constants (20 ms) — slow enough to avoid clicks and zipper noise, fast
 * enough to feel instant.
 */
export const GAIN_SMOOTHING_TIME_CONSTANT_SECONDS = 0.005;

export const METER_UPDATE_INTERVAL_MS = 50;

/**
 * Smallest change in a linear RMS level that is worth publishing to the meters.
 * 1e-4 is a tenth of the -60 dB meter floor, so smaller steps are invisible.
 */
export const METER_LEVEL_EPSILON = 0.0001;

/**
 * Microphone constraints for instrument input — the browser's voice processing
 * (echo cancellation, noise suppression, AGC) colours and gates a guitar signal.
 */
export const INPUT_TRACK_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
};

/** How often the tuner analyses the input signal. */
export const TUNER_UPDATE_INTERVAL_MS = 50;

export const TUNER_MIN_FREQUENCY = 60;

export const TUNER_MAX_FREQUENCY = 1500;

export const TUNER_REFERENCE_A4 = 440;

/** MIDI note number of the A4 reference pitch. */
export const TUNER_REFERENCE_MIDI_NOTE = 69;

/** MIDI octave numbering starts at -1 (MIDI note 0 is C-1). */
export const MIDI_OCTAVE_OFFSET = 1;

export const NOTES_PER_OCTAVE = 12;

export const CENTS_PER_SEMITONE = 100;

/** Input RMS below which the tuner treats the signal as silence. */
export const TUNER_SILENCE_RMS_THRESHOLD = 0.01;

/** Normalized autocorrelation a lag must exceed to count as the signal's period. */
export const TUNER_CORRELATION_THRESHOLD = 0.9;

/**
 * Once a period candidate is found, the search stops when the correlation falls
 * below this fraction of the best value — the first peak has been fully scanned.
 */
export const TUNER_PEAK_FALLOFF_RATIO = 0.8;

/** Keeps the correlation normalization finite when a window half is pure silence. */
export const TUNER_CORRELATION_EPSILON = 1e-10;

/** Decimal places of the reported tuner frequency (matches what the tuner displays). */
export const TUNER_FREQUENCY_DECIMALS = 1;

export const CENTS_THRESHOLD_IN_TUNE = 5;

export const NOTE_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F',
  'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const;

// DC blocking highpass filter cutoff — removes DC offset from waveshaper stages
export const DC_BLOCK_FREQUENCY = 20;

// Guitar input bandpass — cuts noise outside useful guitar range
export const GUITAR_LOWCUT_FREQUENCY = 70;
export const GUITAR_HIGHCUT_FREQUENCY = 7000;

/** `name` values of the errors `getUserMedia` rejects with when the requested device no longer exists. */
export const MISSING_INPUT_DEVICE_ERROR_NAMES: readonly string[] = ['OverconstrainedError', 'NotFoundError'];

/** User-facing messages for the `getUserMedia` failures a user can act on, keyed by error name. */
export const INPUT_ERROR_MESSAGES: Readonly<Record<string, string | undefined>> = {
  NotAllowedError: 'Microphone access was denied. Allow microphone access for this site and try again.',
  NotFoundError: 'No audio input device was found. Connect an interface or microphone and try again.',
  NotReadableError: 'The audio input device is in use by another application.',
};

/** Shown when the page is not served over HTTPS/localhost, where microphone and AudioWorklet APIs do not exist. */
export const ENGINE_ERROR_INSECURE_CONTEXT = 'Audio input requires a secure (HTTPS or localhost) page.';

/** Fallback when an engine failure carries no usable message. */
export const ENGINE_ERROR_FALLBACK = 'The audio engine could not be started.';
