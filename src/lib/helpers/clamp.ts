/**
 * Restricts a number to the inclusive range [min, max].
 * @param value - The number to restrict
 * @param min - Lower bound
 * @param max - Upper bound
 * @returns `value` limited to the range
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
