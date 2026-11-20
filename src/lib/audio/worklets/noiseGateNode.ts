import { disposeWorkletNode, getWorkletParam } from '@/lib/audio/worklets/workletUtils';

// Processor name and AudioParam names — must match public/worklets/noise-gate-processor.js
const NOISE_GATE_PROCESSOR_NAME = 'noise-gate-processor';
const NOISE_GATE_PARAM = {
  THRESHOLD: 'threshold',
  ATTACK: 'attack',
  RELEASE: 'release',
} as const;

/**
 * AudioWorkletNode wrapper for the noise gate processor.
 * Provides typed access to the threshold/attack/release AudioParams.
 */
export class NoiseGateNode {
  readonly node: AudioWorkletNode;
  /** Level that opens the gate, in dBFS (peak) */
  readonly threshold: AudioParam;
  /** Fade-in time in seconds */
  readonly attack: AudioParam;
  /** Fade-out time in seconds */
  readonly release: AudioParam;

  /**
   * The worklet module must already be registered on the AudioContext
   * before constructing this.
   */
  constructor(context: AudioContext) {
    this.node = new AudioWorkletNode(context, NOISE_GATE_PROCESSOR_NAME, {
      numberOfInputs: 1,
      numberOfOutputs: 1,
    });
    this.threshold = getWorkletParam(this.node, NOISE_GATE_PARAM.THRESHOLD);
    this.attack = getWorkletParam(this.node, NOISE_GATE_PARAM.ATTACK);
    this.release = getWorkletParam(this.node, NOISE_GATE_PARAM.RELEASE);
  }

  /** Disconnects the node and lets the browser release its processor. */
  dispose(): void {
    disposeWorkletNode(this.node);
  }
}
