/**
 * Root-mean-square level of a block of time-domain samples.
 * @param samples - Samples in the range -1..1
 * @returns The RMS level (0 for an empty block)
 */
export function computeRms(samples: Float32Array): number {
  if (samples.length === 0) return 0;

  let sumOfSquares = 0;
  for (let i = 0; i < samples.length; i++) {
    sumOfSquares += samples[i] * samples[i];
  }
  return Math.sqrt(sumOfSquares / samples.length);
}
