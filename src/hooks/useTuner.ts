'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { TunerReading } from '@/types/audio';
import {
  NOTE_NAMES,
  TUNER_REFERENCE_A4,
  TUNER_MIN_FREQUENCY,
  TUNER_MAX_FREQUENCY,
} from '@/lib/constants/audio';
import { useAudioStore } from '@/lib/store/audioStore';

const TUNER_UPDATE_INTERVAL_MS = 50;
const CENTS_PER_OCTAVE = 1200;
const NOTES_PER_OCTAVE = 12;
const AUTOCORRELATION_THRESHOLD = 0.9;

/**
 * Detects pitch using autocorrelation on time-domain audio data.
 */
function detectPitch(buffer: Float32Array, sampleRate: number): number {
  let bestOffset = -1;
  let bestCorrelation = 0;
  let foundGoodCorrelation = false;

  const minPeriod = Math.floor(sampleRate / TUNER_MAX_FREQUENCY);
  const maxPeriod = Math.floor(sampleRate / TUNER_MIN_FREQUENCY);
  const bufferLength = buffer.length;

  // RMS check — skip if signal is too quiet
  let rms = 0;
  for (let i = 0; i < bufferLength; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / bufferLength);
  if (rms < 0.01) return -1;

  for (let offset = minPeriod; offset <= maxPeriod; offset++) {
    let correlation = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < bufferLength - offset; i++) {
      correlation += buffer[i] * buffer[i + offset];
      norm1 += buffer[i] * buffer[i];
      norm2 += buffer[i + offset] * buffer[i + offset];
    }

    const normalizedCorrelation = correlation / Math.sqrt(norm1 * norm2 + 1e-10);

    if (normalizedCorrelation > AUTOCORRELATION_THRESHOLD && normalizedCorrelation > bestCorrelation) {
      bestCorrelation = normalizedCorrelation;
      bestOffset = offset;
      foundGoodCorrelation = true;
    } else if (foundGoodCorrelation && normalizedCorrelation < bestCorrelation * 0.8) {
      break;
    }
  }

  if (bestOffset === -1) return -1;
  return sampleRate / bestOffset;
}

function frequencyToNote(frequency: number): TunerReading {
  const semitones = NOTES_PER_OCTAVE * Math.log2(frequency / TUNER_REFERENCE_A4);
  const roundedSemitones = Math.round(semitones);
  const centsOff = Math.round((semitones - roundedSemitones) * 100);

  // A4 is MIDI note 69, note index 9 (A) in octave 4
  const midiNote = 69 + roundedSemitones;
  const noteIndex = ((midiNote % NOTES_PER_OCTAVE) + NOTES_PER_OCTAVE) % NOTES_PER_OCTAVE;
  const octave = Math.floor(midiNote / NOTES_PER_OCTAVE) - 1;

  return {
    frequency,
    note: NOTE_NAMES[noteIndex],
    octave,
    centsOff,
  };
}

export function useTuner(analyser: AnalyserNode | null) {
  const [reading, setReading] = useState<TunerReading | null>(null);
  const { isTunerActive } = useAudioStore();
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTuner = useCallback(() => {
    if (!analyser || animationRef.current) return;

    const buffer = new Float32Array(analyser.fftSize);

    animationRef.current = setInterval(() => {
      analyser.getFloatTimeDomainData(buffer);
      const frequency = detectPitch(buffer, analyser.context.sampleRate);

      if (frequency > 0) {
        setReading(frequencyToNote(frequency));
      } else {
        setReading(null);
      }
    }, TUNER_UPDATE_INTERVAL_MS);
  }, [analyser]);

  const stopTuner = useCallback(() => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
    setReading(null);
  }, []);

  useEffect(() => {
    if (isTunerActive && analyser) {
      startTuner();
    } else {
      stopTuner();
    }
    return () => stopTuner();
  }, [isTunerActive, analyser, startTuner, stopTuner]);

  return { reading, isTunerActive };
}
