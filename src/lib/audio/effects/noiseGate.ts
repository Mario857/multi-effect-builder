import { EffectNode } from '@/lib/audio/effectNode';
import { NoiseGateNode } from '@/lib/audio/worklets/noiseGateNode';
import { NOISE_GATE_DEFINITION } from '@/lib/constants/effects';

/**
 * Noise gate that mutes signal below a dB threshold.
 * Level detection and gating run sample-accurately in an AudioWorklet, so the
 * gate keeps tracking the signal when the tab is in the background.
 * The worklet module must be registered on the AudioContext before constructing
 * (the engine does this on start).
 */
export class NoiseGateEffect extends EffectNode {
  private gate: NoiseGateNode;

  constructor(context: AudioContext) {
    super(context);

    this.gate = new NoiseGateNode(context);

    // Wet path: input → gate → wetNode
    this.inputNode.connect(this.gate.node);
    this.gate.node.connect(this.wetNode);

    this.applyDefaults(NOISE_GATE_DEFINITION);
  }

  protected applyParameter(id: string, value: number): void {
    switch (id) {
      case 'threshold':
        this.setParam(this.gate.threshold, value);
        break;
      case 'attack':
        this.setParam(this.gate.attack, value);
        break;
      case 'release':
        this.setParam(this.gate.release, value);
        break;
    }
  }

  dispose(): void {
    this.gate.dispose();
    this.disposeBase();
  }
}
