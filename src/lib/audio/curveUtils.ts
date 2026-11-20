import { WAVESHAPER_CURVE_SAMPLES } from '@/lib/constants/dsp';

// A WaveShaper curve spans the input range [-1, +1]
const CURVE_INPUT_MIN = -1;
const CURVE_INPUT_SPAN = 2;

// Creates a Float32Array backed by an explicit ArrayBuffer.
// TS 5.9+ makes Float32Array generic — `new Float32Array(n)` returns
// Float32Array<ArrayBufferLike> which is incompatible with Web Audio's
// WaveShaperNode.curve (Float32Array<ArrayBuffer>). Using an explicit
// ArrayBuffer ensures type compatibility.
function createAudioCurve(size: number): Float32Array<ArrayBuffer> {
  const buffer = new ArrayBuffer(size * Float32Array.BYTES_PER_ELEMENT);
  return new Float32Array(buffer);
}

/**
 * Samples a transfer function into a WaveShaperNode curve.
 * The first sample is the output for an input of exactly -1 and the last for
 * exactly +1, matching how WaveShaperNode maps input level to curve index.
 * @param transfer - Maps an input sample in [-1, +1] to its shaped output
 * @returns Curve ready to assign to `WaveShaperNode.curve`
 */
export function createWaveShaperCurve(
  transfer: (input: number) => number,
): Float32Array<ArrayBuffer> {
  const curve = createAudioCurve(WAVESHAPER_CURVE_SAMPLES);
  const lastIndex = WAVESHAPER_CURVE_SAMPLES - 1;
  for (let i = 0; i <= lastIndex; i++) {
    curve[i] = transfer(CURVE_INPUT_MIN + (i * CURVE_INPUT_SPAN) / lastIndex);
  }
  return curve;
}
