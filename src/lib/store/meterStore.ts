import { create } from 'zustand';
import { METER_LEVEL_EPSILON } from '@/lib/constants/audio';

interface MeterState {
  // Linear RMS levels (0..1) of the dry input and the processed output
  inputLevel: number;
  outputLevel: number;
}

interface MeterActions {
  setLevels: (inputLevel: number, outputLevel: number) => void;
}

/**
 * Meter levels live in their own store because they change ~20 times per second.
 * Keeping them out of the audio store means only the meters re-render at that rate.
 */
export const useMeterStore = create<MeterState & MeterActions>()((set) => ({
  inputLevel: 0,
  outputLevel: 0,

  setLevels: (inputLevel, outputLevel) =>
    set((state) => {
      const hasInputChanged = Math.abs(inputLevel - state.inputLevel) >= METER_LEVEL_EPSILON;
      const hasOutputChanged = Math.abs(outputLevel - state.outputLevel) >= METER_LEVEL_EPSILON;
      // Returning the same state object skips the notification — no re-render for an inaudible change
      if (!hasInputChanged && !hasOutputChanged) return state;
      return { inputLevel, outputLevel };
    }),
}));
