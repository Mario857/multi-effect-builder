import type { TunerReading } from '@/types/audio';
import {
  CENTS_PER_SEMITONE,
  MIDI_OCTAVE_OFFSET,
  NOTE_NAMES,
  NOTES_PER_OCTAVE,
  TUNER_CORRELATION_EPSILON,
  TUNER_CORRELATION_THRESHOLD,
  TUNER_FREQUENCY_DECIMALS,
  TUNER_MAX_FREQUENCY,
  TUNER_MIN_FREQUENCY,
  TUNER_PEAK_FALLOFF_RATIO,
  TUNER_REFERENCE_A4,
  TUNER_REFERENCE_MIDI_NOTE,
  TUNER_SILENCE_RMS_THRESHOLD,
} from '@/lib/constants/audio';
import { computeRms } from '@/lib/helpers/computeRms';

/** Correlation (-1..1) between the signal and a copy of itself shifted by `lag` samples. */
function normalizedCorrelation(samples: Float32Array, lag: number): number {
  const overlap = samples.length - lag;
  let correlation = 0;
  let energy = 0;
  let shiftedEnergy = 0;

  for (let i = 0; i < overlap; i++) {
    const sample = samples[i];
    const shifted = samples[i + lag];
    correlation += sample * shifted;
    energy += sample * sample;
    shiftedEnergy += shifted * shifted;
  }

  return correlation / Math.sqrt(energy * shiftedEnergy + TUNER_CORRELATION_EPSILON);
}

/**
 * Refines an integer peak lag to sub-sample precision by fitting a parabola through
 * the correlation at the peak and its two neighbours. Without this, one sample of
 * lag is ~12 cents on the high E string at 48 kHz — coarser than the in-tune window.
 */
function refinePeakLag(samples: Float32Array, peakLag: number, peakCorrelation: number): number {
  const before = normalizedCorrelation(samples, peakLag - 1);
  const after = normalizedCorrelation(samples, peakLag + 1);
  const curvature = before - 2 * peakCorrelation + after;

  // Only a true local maximum has a vertex within half a sample of the peak
  if (curvature >= 0 || before > peakCorrelation || after > peakCorrelation) return peakLag;
  return peakLag + (before - after) / (2 * curvature);
}

/**
 * Detects pitch using autocorrelation on time-domain audio data.
 * @param samples - One analysis window of time-domain samples
 * @param sampleRate - Sample rate the window was captured at
 * @returns The fundamental frequency in Hz, or null when the signal is silent or not periodic
 */
export function detectPitch(samples: Float32Array, sampleRate: number): number | null {
  // RMS check — skip if signal is too quiet
  if (computeRms(samples) < TUNER_SILENCE_RMS_THRESHOLD) return null;

  const minLag = Math.floor(sampleRate / TUNER_MAX_FREQUENCY);
  // At least half the window must overlap for the correlation to be meaningful
  const maxLag = Math.min(Math.floor(sampleRate / TUNER_MIN_FREQUENCY), Math.floor(samples.length / 2));

  let hasLeftZeroLagPeak = false;
  let bestLag = 0;
  let bestCorrelation = 0;

  for (let lag = 1; lag <= maxLag; lag++) {
    const correlation = normalizedCorrelation(samples, lag);

    if (!hasLeftZeroLagPeak) {
      // Any signal correlates almost perfectly with itself at tiny lags. Candidates only
      // count once that zero-lag peak has decayed — otherwise a low note, which is still
      // above the threshold at the shortest lag, is reported as the highest frequency.
      hasLeftZeroLagPeak = correlation < TUNER_CORRELATION_THRESHOLD;
      continue;
    }
    if (lag < minLag) continue;

    if (correlation > TUNER_CORRELATION_THRESHOLD && correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestLag = lag;
    } else if (bestLag > 0 && correlation < bestCorrelation * TUNER_PEAK_FALLOFF_RATIO) {
      break;
    }
  }

  if (bestLag === 0) return null;
  return sampleRate / refinePeakLag(samples, bestLag, bestCorrelation);
}

/**
 * Maps a frequency onto the nearest equal-tempered note.
 * @param frequency - Frequency in Hz (must be positive)
 * @returns The note name, octave and deviation in cents
 */
export function frequencyToTunerReading(frequency: number): TunerReading {
  const semitones = NOTES_PER_OCTAVE * Math.log2(frequency / TUNER_REFERENCE_A4);
  const roundedSemitones = Math.round(semitones);
  const centsOff = Math.round((semitones - roundedSemitones) * CENTS_PER_SEMITONE);

  // A4 is MIDI note 69, note index 9 (A) in octave 4
  const midiNote = TUNER_REFERENCE_MIDI_NOTE + roundedSemitones;
  const noteIndex = ((midiNote % NOTES_PER_OCTAVE) + NOTES_PER_OCTAVE) % NOTES_PER_OCTAVE;
  const octave = Math.floor(midiNote / NOTES_PER_OCTAVE) - MIDI_OCTAVE_OFFSET;

  return {
    // Rounded so that jitter below the displayed precision does not count as a new reading
    frequency: Number(frequency.toFixed(TUNER_FREQUENCY_DECIMALS)),
    note: NOTE_NAMES[noteIndex],
    octave,
    centsOff,
  };
}

/**
 * Compares two tuner readings by value.
 * @param a - First reading (null = no pitch detected)
 * @param b - Second reading (null = no pitch detected)
 * @returns Whether both would display identically
 */
export function isSameTunerReading(a: TunerReading | null, b: TunerReading | null): boolean {
  if (a === null || b === null) return a === b;
  return (
    a.frequency === b.frequency
    && a.note === b.note
    && a.octave === b.octave
    && a.centsOff === b.centsOff
  );
}
