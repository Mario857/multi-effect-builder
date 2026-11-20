'use client';

import { useState, useEffect } from 'react';
import type { TunerReading } from '@/types/audio';
import { getInputAnalyser } from '@/lib/audio/engineController';
import { TUNER_UPDATE_INTERVAL_MS } from '@/lib/constants/audio';
import {
  detectPitch,
  frequencyToTunerReading,
  isSameTunerReading,
} from '@/lib/helpers/pitchDetection';
import { useAudioStore } from '@/lib/store/audioStore';

/** The tuner's current output. */
export interface TunerState {
  /** The detected note, or null when the tuner is off, the engine is stopped or no pitch is detected. */
  readonly reading: TunerReading | null;
}

/**
 * Runs pitch detection on the engine's input while the engine is running and
 * the tuner is switched on. Call it from the component that displays the
 * reading — readings update many times per second and only that component
 * should re-render.
 * @returns The current tuner reading
 */
export function useTuner(): TunerState {
  const [reading, setReading] = useState<TunerReading | null>(null);
  const isListening = useAudioStore((state) => state.isEngineRunning && state.isTunerActive);

  useEffect(() => {
    if (!isListening) return;

    const analyser = getInputAnalyser();
    if (!analyser) return;

    const buffer = new Float32Array(analyser.fftSize);

    const timer = setInterval(() => {
      // Pitch detection is the most expensive periodic work on the page — skip it when nobody can see the result
      if (document.hidden) return;

      analyser.getFloatTimeDomainData(buffer);
      const frequency = detectPitch(buffer, analyser.context.sampleRate);
      const nextReading = frequency === null ? null : frequencyToTunerReading(frequency);

      // Keeping the previous object when nothing visible changed lets React skip the re-render
      setReading((previous) => (isSameTunerReading(previous, nextReading) ? previous : nextReading));
    }, TUNER_UPDATE_INTERVAL_MS);

    return () => {
      clearInterval(timer);
      setReading(null);
    };
  }, [isListening]);

  return { reading };
}
