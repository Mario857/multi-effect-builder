/**
 * Creates a Float32Array backed by an explicit ArrayBuffer.
 * TS 5.9+ makes Float32Array generic — `new Float32Array(n)` returns
 * Float32Array<ArrayBufferLike> which is incompatible with Web Audio's
 * WaveShaperNode.curve (Float32Array<ArrayBuffer>). Using an explicit
 * ArrayBuffer ensures type compatibility.
 */
export function createAudioCurve(size: number): Float32Array<ArrayBuffer> {
  const buffer = new ArrayBuffer(size * Float32Array.BYTES_PER_ELEMENT);
  return new Float32Array(buffer);
}

/**
 * Assigns a curve to a WaveShaperNode, handling TS 5.9 typed array generics.
 */
export function setWaveShaperCurve(
  node: WaveShaperNode,
  curveGenerator: () => Float32Array<ArrayBuffer>,
): void {
  node.curve = curveGenerator();
}
