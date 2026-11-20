export const SAMPLE_RATE = 44100;

export const BUFFER_SIZE = 2048;

export const MIN_DECIBELS = -100;

export const MAX_DECIBELS = -10;

export const FFT_SIZE = 2048;

export const SMOOTHING_TIME_CONSTANT = 0.8;

export const MASTER_VOLUME_DEFAULT = 0.75;

export const MASTER_VOLUME_MIN = 0;

export const MASTER_VOLUME_MAX = 1;

export const METER_UPDATE_INTERVAL_MS = 50;

export const TUNER_MIN_FREQUENCY = 60;

export const TUNER_MAX_FREQUENCY = 1500;

export const TUNER_REFERENCE_A4 = 440;

export const CENTS_THRESHOLD_IN_TUNE = 5;

export const NOTE_NAMES = [
  'C', 'C#', 'D', 'D#', 'E', 'F',
  'F#', 'G', 'G#', 'A', 'A#', 'B',
] as const;

export const GUITAR_STANDARD_TUNING = [
  { note: 'E', octave: 2, frequency: 82.41 },
  { note: 'A', octave: 2, frequency: 110.0 },
  { note: 'D', octave: 3, frequency: 146.83 },
  { note: 'G', octave: 3, frequency: 196.0 },
  { note: 'B', octave: 3, frequency: 246.94 },
  { note: 'E', octave: 4, frequency: 329.63 },
] as const;

// DC blocking highpass filter cutoff — removes DC offset from waveshaper stages
export const DC_BLOCK_FREQUENCY = 20;

// Guitar input bandpass — cuts noise outside useful guitar range
export const GUITAR_LOWCUT_FREQUENCY = 70;
export const GUITAR_HIGHCUT_FREQUENCY = 7000;

export const AUDIO_CONSTRAINTS: MediaStreamConstraints = {
  audio: {
    echoCancellation: false,
    noiseSuppression: false,
    autoGainControl: false,
    latencyHint: 'interactive',
  } as MediaTrackConstraints,
  video: false,
};
