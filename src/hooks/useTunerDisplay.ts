'use client';

import { useMemo } from 'react';
import { useTuner } from '@/hooks/useTuner';
import { CENTS_THRESHOLD_IN_TUNE, TUNER_FREQUENCY_DECIMALS } from '@/lib/constants/audio';
import { TUNER_CENTS_RANGE, TUNER_INDICATOR_SEGMENTS } from '@/lib/constants/ui';
import { useAudioStore } from '@/lib/store/audioStore';

const CENTER_INDEX = Math.floor(TUNER_INDICATOR_SEGMENTS / 2);

// Deviation in cents each indicator segment stands for, from flat (left) to sharp (right)
const SEGMENT_CENTS = Array.from(
  { length: TUNER_INDICATOR_SEGMENTS },
  (_, index) => ((index - CENTER_INDEX) / CENTER_INDEX) * TUNER_CENTS_RANGE,
);

/** One segment of the tuner's cents indicator. */
export interface TunerSegment {
  readonly index: number;
  /** Lit: between the centre and the current deviation. */
  readonly isActive: boolean;
  /** The middle segment, which marks "in tune". */
  readonly isCenter: boolean;
}

/** The detected note, ready to display. */
export interface TunerNote {
  readonly note: string;
  readonly octave: number;
  readonly isInTune: boolean;
  /** Frequency readout, e.g. `110.0 Hz`. */
  readonly frequencyLabel: string;
  /** Signed deviation readout, e.g. `+12¢`. */
  readonly centsLabel: string;
  readonly segments: readonly TunerSegment[];
}

/** What the tuner displays. */
export interface TunerDisplayState {
  /** Null while no pitch is detected. */
  readonly tunerNote: TunerNote | null;
  /** The tuner hears nothing while the engine is stopped. */
  readonly isEngineRunning: boolean;
}

/**
 * Turns the tuner's reading into what the tuner component draws. Call it from the
 * component that shows the tuner: readings arrive many times per second.
 * @returns The detected note with its readouts and indicator segments, or null
 */
export function useTunerDisplay(): TunerDisplayState {
  // The tuner owns its readings so that their ~20 updates per second re-render only this component
  const { reading } = useTuner();
  const isEngineRunning = useAudioStore((state) => state.isEngineRunning);

  const tunerNote = useMemo(() => {
    if (!reading) return null;

    const { centsOff } = reading;
    return {
      note: reading.note,
      octave: reading.octave,
      isInTune: Math.abs(centsOff) <= CENTS_THRESHOLD_IN_TUNE,
      frequencyLabel: `${reading.frequency.toFixed(TUNER_FREQUENCY_DECIMALS)} Hz`,
      centsLabel: `${centsOff > 0 ? '+' : ''}${centsOff}¢`,
      segments: SEGMENT_CENTS.map((segmentCents, index) => ({
        index,
        isActive:
          centsOff >= 0
            ? segmentCents >= 0 && segmentCents <= centsOff
            : segmentCents <= 0 && segmentCents >= centsOff,
        isCenter: index === CENTER_INDEX,
      })),
    };
  }, [reading]);

  return { tunerNote, isEngineRunning };
}
