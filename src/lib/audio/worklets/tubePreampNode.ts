import type { AmpType } from '@/types/audio';
import {
  AMP_TYPE_INDEX,
  TUBE_PREAMP_PARAM,
  TUBE_PREAMP_PROCESSOR_NAME,
} from '@/lib/audio/worklets/tubePreampConstants';
import { disposeWorkletNode, getWorkletParam } from '@/lib/audio/worklets/workletUtils';

/**
 * AudioWorkletNode wrapper for the tube preamp processor.
 * Provides typed access to the gain/sagAmount AudioParams.
 * The amp type is fixed for the lifetime of the node.
 */
export class TubePreampNode {
  readonly node: AudioWorkletNode;
  /** Preamp drive, 0–1 */
  readonly gain: AudioParam;
  /** Power supply sag amount, 0–1 */
  readonly sagAmount: AudioParam;

  /**
   * The worklet module must already be registered on the AudioContext
   * before constructing this.
   */
  constructor(context: AudioContext, ampType: AmpType) {
    this.node = new AudioWorkletNode(context, TUBE_PREAMP_PROCESSOR_NAME, {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      processorOptions: {
        ampType: AMP_TYPE_INDEX[ampType],
      },
    });
    this.gain = getWorkletParam(this.node, TUBE_PREAMP_PARAM.GAIN);
    this.sagAmount = getWorkletParam(this.node, TUBE_PREAMP_PARAM.SAG_AMOUNT);
  }

  /** Disconnects the node and lets the browser release its processor. */
  dispose(): void {
    disposeWorkletNode(this.node);
  }
}
