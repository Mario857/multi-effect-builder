import { EffectNode } from '@/lib/audio/effectNode';

const CHECK_INTERVAL_MS = 10;
const DB_REFERENCE = 20;
const PARAM_RAMP_TIME = 0.02;

/**
 * Noise gate that mutes signal below a dB threshold.
 * Uses an AnalyserNode to monitor input level and a GainNode to gate.
 */
export class NoiseGateEffect extends EffectNode {
  private analyser: AnalyserNode;
  private gateGain: GainNode;
  private threshold: number;
  private attackTime: number;
  private releaseTime: number;
  private intervalId: ReturnType<typeof setInterval> | null;
  private isOpen: boolean;

  constructor(context: AudioContext) {
    super(context);

    this.threshold = -45;
    this.attackTime = 0.005;
    this.releaseTime = 0.1;
    this.isOpen = true;
    this.intervalId = null;

    this.analyser = context.createAnalyser();
    this.analyser.fftSize = 256;

    this.gateGain = context.createGain();
    this.gateGain.gain.value = 1;

    // Wet path: input → analyser, input → gateGain → wetNode
    this.inputNode.connect(this.analyser);
    this.inputNode.connect(this.gateGain);
    this.gateGain.connect(this.wetNode);

    this.startMonitoring();
  }

  private startMonitoring(): void {
    const dataArray = new Float32Array(this.analyser.fftSize);

    this.intervalId = setInterval(() => {
      this.analyser.getFloatTimeDomainData(dataArray);

      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i] * dataArray[i];
      }
      const rms = Math.sqrt(sum / dataArray.length);
      const db = DB_REFERENCE * Math.log10(Math.max(rms, 1e-10));

      const now = this.context.currentTime;

      if (db >= this.threshold && !this.isOpen) {
        this.isOpen = true;
        this.gateGain.gain.linearRampToValueAtTime(1, now + this.attackTime);
      } else if (db < this.threshold && this.isOpen) {
        this.isOpen = false;
        this.gateGain.gain.linearRampToValueAtTime(0, now + this.releaseTime);
      }
    }, CHECK_INTERVAL_MS);
  }

  setParameter(id: string, value: number): void {
    switch (id) {
      case 'threshold':
        this.threshold = value;
        break;
      case 'attack':
        this.attackTime = value;
        break;
      case 'release':
        this.releaseTime = value;
        break;
    }
  }

  dispose(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.analyser.disconnect();
    this.gateGain.disconnect();
    this.disposeBase();
  }
}
