import {
  DC_BLOCK_FREQUENCY,
  GUITAR_LOWCUT_FREQUENCY,
  GUITAR_HIGHCUT_FREQUENCY,
} from '@/lib/constants/audio';
import { BUTTERWORTH_Q } from '@/lib/constants/dsp';

/**
 * Static configuration of a BiquadFilterNode.
 */
export interface BiquadFilterSettings {
  readonly type: BiquadFilterType;
  /** Cutoff / centre frequency in Hz. Omit when a parameter sets it right after construction. */
  readonly frequency?: number;
  /** Resonance — ignored by shelving filters. Defaults to the node's own default. */
  readonly q?: number;
  /** Boost/cut in dB — only used by peaking and shelving filters. Defaults to 0. */
  readonly gain?: number;
}

/**
 * Creates a BiquadFilterNode with its type and initial values set in one call.
 * @param context - Audio context that owns the node
 * @param settings - Filter type and initial frequency / Q / gain
 * @returns The configured filter node
 */
export function createBiquadFilter(
  context: AudioContext,
  settings: BiquadFilterSettings,
): BiquadFilterNode {
  const filter = context.createBiquadFilter();
  filter.type = settings.type;
  if (settings.frequency !== undefined) {
    filter.frequency.value = settings.frequency;
  }
  if (settings.q !== undefined) {
    filter.Q.value = settings.q;
  }
  if (settings.gain !== undefined) {
    filter.gain.value = settings.gain;
  }
  return filter;
}

/**
 * Creates a DC blocking highpass filter.
 * Waveshapers generate DC offset that accumulates through gain stages,
 * eventually pushing the signal to a rail and causing silence.
 * Place one after each waveshaper stage.
 */
export function createDCBlockFilter(context: AudioContext): BiquadFilterNode {
  return createBiquadFilter(context, {
    type: 'highpass',
    frequency: DC_BLOCK_FREQUENCY,
    q: BUTTERWORTH_Q,
  });
}

/**
 * Creates a lowcut filter to remove rumble below guitar range.
 * Cuts hum, handling noise, and sub-bass rumble before amplification.
 */
export function createInputLowCut(context: AudioContext): BiquadFilterNode {
  return createBiquadFilter(context, {
    type: 'highpass',
    frequency: GUITAR_LOWCUT_FREQUENCY,
    q: BUTTERWORTH_Q,
  });
}

/**
 * Creates a highcut filter to remove hiss above guitar range.
 * Cuts high-frequency noise before it gets amplified by gain stages.
 */
export function createInputHighCut(context: AudioContext): BiquadFilterNode {
  return createBiquadFilter(context, {
    type: 'lowpass',
    frequency: GUITAR_HIGHCUT_FREQUENCY,
    q: BUTTERWORTH_Q,
  });
}
