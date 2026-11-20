'use client';

import {
  LEVEL_METER_DB_FLOOR,
  LEVEL_METER_DISPLAY_GAIN,
  LEVEL_METER_SILENCE_LABEL,
} from '@/lib/constants/ui';
import { levelToDecibels } from '@/lib/helpers/levelToDecibels';
import { useAudioStore } from '@/lib/store/audioStore';
import { useMeterStore } from '@/lib/store/meterStore';

/** What the meter strip displays. */
export interface MeterStripState {
  /** Input level scaled for the meter (can exceed 1 — the meter clamps). */
  readonly inputMeterLevel: number;
  /** Output level scaled for the meter (can exceed 1 — the meter clamps). */
  readonly outputMeterLevel: number;
  /** Input level readout, e.g. `-18 dB`. */
  readonly inputDbLabel: string;
  /** Output level readout, e.g. `-18 dB`. */
  readonly outputDbLabel: string;
  readonly masterVolume: number;
  readonly setMasterVolume: (volume: number) => void;
}

function formatDbLabel(level: number): string {
  const decibels = levelToDecibels(level, LEVEL_METER_DB_FLOOR);
  const readout = decibels <= LEVEL_METER_DB_FLOOR ? LEVEL_METER_SILENCE_LABEL : `${decibels}`;
  return `${readout} dB`;
}

/**
 * State of the meter strip. This is the one place that subscribes to the meter store,
 * whose levels change about 20 times per second.
 * @returns Meter levels, their dB readouts and the master volume with its setter
 */
export function useMeterStrip(): MeterStripState {
  const inputLevel = useMeterStore((state) => state.inputLevel);
  const outputLevel = useMeterStore((state) => state.outputLevel);
  const masterVolume = useAudioStore((state) => state.masterVolume);
  const setMasterVolume = useAudioStore((state) => state.setMasterVolume);

  return {
    inputMeterLevel: inputLevel * LEVEL_METER_DISPLAY_GAIN,
    outputMeterLevel: outputLevel * LEVEL_METER_DISPLAY_GAIN,
    inputDbLabel: formatDbLabel(inputLevel),
    outputDbLabel: formatDbLabel(outputLevel),
    masterVolume,
    setMasterVolume,
  };
}
