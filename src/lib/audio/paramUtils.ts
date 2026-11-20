import { PARAM_SMOOTHING_TIME_CONSTANT } from '@/lib/constants/dsp';

/**
 * Glides an AudioParam to a new value without clicks or zipper noise.
 *
 * Uses `setTargetAtTime` rather than `linearRampToValueAtTime`: a ramp is
 * interpolated from the *previous* automation event, so on a param that has
 * been idle it jumps almost all the way to the target on the next render
 * quantum. An exponential approach always starts from whatever the param's
 * value is at `time`, with no anchor event and without reading `param.value`
 * (which does not reflect running automation in every browser).
 *
 * @param param - The AudioParam to change
 * @param value - Target value in the param's own unit
 * @param time - Context time at which the glide starts (normally `context.currentTime`)
 */
export function smoothParam(param: AudioParam, value: number, time: number): void {
  // Drop anything scheduled from `time` on so the most recent call always wins
  param.cancelScheduledValues(time);
  param.setTargetAtTime(value, time, PARAM_SMOOTHING_TIME_CONSTANT);
}
