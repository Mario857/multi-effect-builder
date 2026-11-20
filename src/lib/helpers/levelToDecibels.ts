// A tenfold change in amplitude is 20 dB
const DECIBELS_PER_AMPLITUDE_DECADE = 20;

/**
 * Converts a linear amplitude (1 = full scale) to whole decibels.
 * @param level - Linear amplitude, e.g. an RMS level
 * @param floorDb - Lowest value to return; silence (a level of 0) maps to it
 * @returns The level in dB, rounded to a whole number and never below `floorDb`
 */
export function levelToDecibels(level: number, floorDb: number): number {
  if (level <= 0) return floorDb;
  return Math.max(floorDb, Math.round(DECIBELS_PER_AMPLITUDE_DECADE * Math.log10(level)));
}
