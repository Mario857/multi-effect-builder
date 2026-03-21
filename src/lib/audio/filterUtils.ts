import {
  DC_BLOCK_FREQUENCY,
  GUITAR_LOWCUT_FREQUENCY,
  GUITAR_HIGHCUT_FREQUENCY,
} from '@/lib/constants/audio';

/**
 * Creates a DC blocking highpass filter.
 * Waveshapers generate DC offset that accumulates through gain stages,
 * eventually pushing the signal to a rail and causing silence.
 * Place one after each waveshaper stage.
 */
export function createDCBlockFilter(context: AudioContext): BiquadFilterNode {
  const filter = context.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = DC_BLOCK_FREQUENCY;
  filter.Q.value = 0.7;
  return filter;
}

/**
 * Creates a lowcut filter to remove rumble below guitar range.
 * Cuts hum, handling noise, and sub-bass rumble before amplification.
 */
export function createInputLowCut(context: AudioContext): BiquadFilterNode {
  const filter = context.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = GUITAR_LOWCUT_FREQUENCY;
  filter.Q.value = 0.7;
  return filter;
}

/**
 * Creates a highcut filter to remove hiss above guitar range.
 * Cuts high-frequency noise before it gets amplified by gain stages.
 */
export function createInputHighCut(context: AudioContext): BiquadFilterNode {
  const filter = context.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = GUITAR_HIGHCUT_FREQUENCY;
  filter.Q.value = 0.7;
  return filter;
}
