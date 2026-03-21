import { EffectNode } from '@/lib/audio/effectNode';
import { createAudioCurve, setWaveShaperCurve } from '@/lib/audio/curveUtils';
import { createDCBlockFilter } from '@/lib/audio/filterUtils';

const CURVE_SAMPLES = 44100;
const SOFT_CLIP_AMOUNT = 0.7;
const HARD_CLIP_THRESHOLD = 0.5;
const TUBE_WARMTH = 3;

function createSoftClipCurve(drive: number) {
  const curve = createAudioCurve(CURVE_SAMPLES);
  const amount = drive * 50 + 1;
  for (let i = 0; i < CURVE_SAMPLES; i++) {
    const x = (i * 2) / CURVE_SAMPLES - 1;
    curve[i] = ((TUBE_WARMTH + amount) * x) / (TUBE_WARMTH + amount * Math.abs(x));
  }
  return curve;
}

function createHardClipCurve(drive: number) {
  const curve = createAudioCurve(CURVE_SAMPLES);
  const threshold = HARD_CLIP_THRESHOLD + (1 - drive) * HARD_CLIP_THRESHOLD;
  for (let i = 0; i < CURVE_SAMPLES; i++) {
    const x = (i * 2) / CURVE_SAMPLES - 1;
    curve[i] = Math.max(-threshold, Math.min(threshold, x * (1 + drive * 10)));
  }
  return curve;
}

function createTubeClipCurve(drive: number) {
  const curve = createAudioCurve(CURVE_SAMPLES);
  const amount = drive * 20 + 1;
  for (let i = 0; i < CURVE_SAMPLES; i++) {
    const x = (i * 2) / CURVE_SAMPLES - 1;
    // Asymmetric tube-like clipping
    if (x >= 0) {
      curve[i] = 1 - Math.exp(-amount * x);
    } else {
      curve[i] = -(1 - Math.exp(amount * x * SOFT_CLIP_AMOUNT));
    }
  }
  return curve;
}

export class DistortionEffect extends EffectNode {
  private inputBoost: GainNode;
  private waveShaperNode: WaveShaperNode;
  private dcBlockFilter: BiquadFilterNode;
  private toneFilter: BiquadFilterNode;
  private driveGain: GainNode;
  private drive: number;

  constructor(context: AudioContext) {
    super(context);

    this.drive = 0.5;

    // Input boost to push the signal into the waveshaper
    this.inputBoost = context.createGain();
    this.inputBoost.gain.value = this.drive * 20 + 1;

    this.waveShaperNode = context.createWaveShaper();
    this.waveShaperNode.oversample = '4x';
    setWaveShaperCurve(this.waveShaperNode, () => createTubeClipCurve(this.drive));

    // DC blocking after waveshaper prevents offset buildup
    this.dcBlockFilter = createDCBlockFilter(context);

    this.toneFilter = context.createBiquadFilter();
    this.toneFilter.type = 'lowpass';
    this.toneFilter.frequency.value = 3000;
    this.toneFilter.Q.value = 0.7;

    this.driveGain = context.createGain();
    this.driveGain.gain.value = 0.7;

    // Wet path: input → boost → waveshaper → dcBlock → tone filter → drive gain → wet
    this.inputNode.connect(this.inputBoost);
    this.inputBoost.connect(this.waveShaperNode);
    this.waveShaperNode.connect(this.dcBlockFilter);
    this.dcBlockFilter.connect(this.toneFilter);
    this.toneFilter.connect(this.driveGain);
    this.driveGain.connect(this.wetNode);
  }

  setParameter(id: string, value: number): void {
    const now = this.context.currentTime;
    const rampTime = 0.02;
    switch (id) {
      case 'drive':
        this.drive = value;
        this.inputBoost.gain.linearRampToValueAtTime(value * 20 + 1, now + rampTime);
        setWaveShaperCurve(this.waveShaperNode, () => createTubeClipCurve(value));
        break;
      case 'tone':
        this.toneFilter.frequency.linearRampToValueAtTime(value, now + rampTime);
        break;
      case 'level':
        this.driveGain.gain.linearRampToValueAtTime(value, now + rampTime);
        break;
      case 'mix':
        this.wetNode.gain.linearRampToValueAtTime(value, now + rampTime);
        this.bypassNode.gain.linearRampToValueAtTime(1 - value, now + rampTime);
        break;
    }
  }

  dispose(): void {
    this.inputBoost.disconnect();
    this.waveShaperNode.disconnect();
    this.dcBlockFilter.disconnect();
    this.toneFilter.disconnect();
    this.driveGain.disconnect();
    this.disposeBase();
  }
}

export { createSoftClipCurve, createHardClipCurve, createTubeClipCurve };
