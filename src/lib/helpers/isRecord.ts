/**
 * Narrows an untrusted value (parsed JSON, a caught error, …) to an object whose
 * properties can be read safely as `unknown`.
 * @param value - The value to test
 * @returns Whether `value` is a non-null object
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
