import type { EffectParameterValue } from '@/types/audio';

/**
 * Base class for all audio effect nodes.
 * Wraps Web Audio API nodes with bypass, connect/disconnect, and parameter control.
 */
export abstract class EffectNode {
  protected context: AudioContext;
  protected inputNode: GainNode;
  protected outputNode: GainNode;
  protected bypassNode: GainNode;
  protected wetNode: GainNode;
  private _isBypassed: boolean;

  constructor(context: AudioContext) {
    this.context = context;
    this.inputNode = context.createGain();
    this.outputNode = context.createGain();
    this.bypassNode = context.createGain();
    this.wetNode = context.createGain();
    this._isBypassed = false;

    // Bypass path: input → bypass → output
    this.inputNode.connect(this.bypassNode);
    this.bypassNode.connect(this.outputNode);

    // Wet path: input → [processing] → wet → output
    this.wetNode.connect(this.outputNode);

    this.updateBypassGains();
  }

  get input(): GainNode {
    return this.inputNode;
  }

  get output(): GainNode {
    return this.outputNode;
  }

  get isBypassed(): boolean {
    return this._isBypassed;
  }

  set isBypassed(value: boolean) {
    this._isBypassed = value;
    this.updateBypassGains();
  }

  private updateBypassGains(): void {
    const now = this.context.currentTime;
    const rampTime = 0.02;
    if (this._isBypassed) {
      this.bypassNode.gain.linearRampToValueAtTime(1, now + rampTime);
      this.wetNode.gain.linearRampToValueAtTime(0, now + rampTime);
    } else {
      this.bypassNode.gain.linearRampToValueAtTime(0, now + rampTime);
      this.wetNode.gain.linearRampToValueAtTime(1, now + rampTime);
    }
  }

  abstract setParameter(id: string, value: number): void;

  setParameters(parameters: readonly EffectParameterValue[]): void {
    for (const param of parameters) {
      this.setParameter(param.id, param.value);
    }
  }

  abstract dispose(): void;

  protected disposeBase(): void {
    this.inputNode.disconnect();
    this.outputNode.disconnect();
    this.bypassNode.disconnect();
    this.wetNode.disconnect();
  }
}
