import { WORKLET_DISPOSE_MESSAGE_TYPE } from '@/lib/constants/dsp';

/**
 * Looks up an AudioParam declared in a worklet processor's `parameterDescriptors`.
 * @param node - The AudioWorkletNode that owns the param
 * @param name - Param name as declared by the processor
 * @returns The AudioParam
 * @throws If the processor does not declare the param, i.e. the processor file
 *   in public/worklets/ and its TypeScript wrapper have drifted apart
 */
export function getWorkletParam(node: AudioWorkletNode, name: string): AudioParam {
  const param = node.parameters.get(name);
  if (!param) {
    throw new Error(`AudioWorklet processor does not declare a "${name}" parameter`);
  }
  return param;
}

/**
 * Disconnects a worklet node and tells its processor to stop.
 * A processor that keeps returning `true` from `process()` is kept alive by the
 * browser forever, so disconnecting the node alone would leak it.
 * @param node - The AudioWorkletNode to tear down
 */
export function disposeWorkletNode(node: AudioWorkletNode): void {
  node.port.postMessage({ type: WORKLET_DISPOSE_MESSAGE_TYPE });
  node.disconnect();
}
