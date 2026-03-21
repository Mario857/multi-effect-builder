import type { EffectType } from '@/types/audio';
import {
  TUBE_PREAMP_PROCESSOR_NAME,
  getAmpTypeIndex,
} from '@/lib/audio/worklets/tubePreampConstants';

const PARAM_RAMP_TIME = 0.02;

/**
 * AudioWorkletNode wrapper for the tube preamp processor.
 * Provides typed access to gain/sagAmount AudioParams and
 * amp type switching via MessagePort.
 */
export class TubePreampNode {
  readonly node: AudioWorkletNode;
  private readonly gainParam: AudioParam;
  private readonly sagParam: AudioParam;

  private constructor(node: AudioWorkletNode) {
    this.node = node;
    this.gainParam = node.parameters.get('gain')!;
    this.sagParam = node.parameters.get('sagAmount')!;
  }

  /**
   * Create a TubePreampNode. The worklet module must already be registered
   * on the AudioContext before calling this.
   */
  static create(context: AudioContext, ampType: EffectType): TubePreampNode {
    const workletNode = new AudioWorkletNode(context, TUBE_PREAMP_PROCESSOR_NAME, {
      numberOfInputs: 1,
      numberOfOutputs: 1,
      outputChannelCount: [1],
      processorOptions: {
        ampType: getAmpTypeIndex(ampType),
      },
    });

    return new TubePreampNode(workletNode);
  }

  setGain(value: number, time: number): void {
    this.gainParam.linearRampToValueAtTime(value, time + PARAM_RAMP_TIME);
  }

  setSagAmount(value: number, time: number): void {
    this.sagParam.linearRampToValueAtTime(value, time + PARAM_RAMP_TIME);
  }

  setAmpType(ampType: EffectType): void {
    this.node.port.postMessage({
      type: 'setAmpType',
      ampType: getAmpTypeIndex(ampType),
    });
  }

  connect(destination: AudioNode): void {
    this.node.connect(destination);
  }

  disconnect(): void {
    this.node.disconnect();
  }
}
