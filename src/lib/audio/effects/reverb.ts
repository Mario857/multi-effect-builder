import { EffectNode } from '@/lib/audio/effectNode';

const PARAM_RAMP_TIME = 0.02;
const IR_SAMPLE_RATE = 44100;

// Early reflection delays (in seconds) — simulates discrete wall bounces
const EARLY_REFLECTION_TAPS = [0.011, 0.019, 0.027, 0.037, 0.048, 0.063] as const;
const EARLY_REFLECTION_GAINS = [0.85, 0.72, 0.60, 0.48, 0.38, 0.28] as const;

/**
 * Generates an impulse response with early reflections and diffuse tail.
 * Early reflections create spatial depth; the tail adds lushness.
 */
function generateImpulseResponse(
  context: AudioContext,
  decay: number,
  size: number,
  damping: number,
): AudioBuffer {
  const sampleRate = context.sampleRate || IR_SAMPLE_RATE;
  const length = Math.floor(sampleRate * decay);
  const buffer = context.createBuffer(2, length, sampleRate);
  const channelL = buffer.getChannelData(0);
  const channelR = buffer.getChannelData(1);

  // Phase 1: Early reflections — discrete taps for spatial depth
  const sizeScale = 0.5 + size * 1.5;
  for (let tapIndex = 0; tapIndex < EARLY_REFLECTION_TAPS.length; tapIndex++) {
    const tapTime = EARLY_REFLECTION_TAPS[tapIndex] * sizeScale;
    const tapGain = EARLY_REFLECTION_GAINS[tapIndex];
    const tapSample = Math.floor(tapTime * sampleRate);

    if (tapSample < length) {
      // Slightly different L/R timing for stereo width
      const offsetL = tapSample;
      const offsetR = Math.min(tapSample + Math.floor(sampleRate * 0.002), length - 1);
      channelL[offsetL] += tapGain;
      channelR[offsetR] += tapGain * 0.95;
    }
  }

  // Phase 2: Diffuse tail — builds after early reflections
  const tailStart = Math.floor(sampleRate * 0.07 * sizeScale);
  for (let i = tailStart; i < length; i++) {
    const t = (i - tailStart) / sampleRate;
    const tailLength = decay - (tailStart / sampleRate);
    // Smooth exponential decay
    const envelope = Math.exp(-t * (4 / tailLength));
    // High-frequency damping — higher frequencies decay faster
    const dampingFactor = Math.exp(-t * damping * 6);
    const amplitude = envelope * dampingFactor * 0.4;
    channelL[i] += (Math.random() * 2 - 1) * amplitude;
    channelR[i] += (Math.random() * 2 - 1) * amplitude;
  }

  return buffer;
}

export class ReverbEffect extends EffectNode {
  private convolverNode: ConvolverNode;
  private wetGain: GainNode;
  private dryGain: GainNode;
  private decay: number;
  private size: number;
  private damping: number;

  constructor(context: AudioContext) {
    super(context);

    this.decay = 2.5;
    this.size = 0.5;
    this.damping = 0.5;

    this.convolverNode = context.createConvolver();
    this.convolverNode.buffer = generateImpulseResponse(context, this.decay, this.size, this.damping);

    this.wetGain = context.createGain();
    this.wetGain.gain.value = 0.3;

    this.dryGain = context.createGain();
    this.dryGain.gain.value = 0.7;

    // Wet path: input → convolver → wetGain → wetNode
    this.inputNode.connect(this.convolverNode);
    this.convolverNode.connect(this.wetGain);
    this.wetGain.connect(this.wetNode);

    // Dry path: input → dryGain → wetNode
    this.inputNode.connect(this.dryGain);
    this.dryGain.connect(this.wetNode);
  }

  private regenerateIR(): void {
    this.convolverNode.buffer = generateImpulseResponse(
      this.context,
      this.decay,
      this.size,
      this.damping,
    );
  }

  setParameter(id: string, value: number): void {
    const now = this.context.currentTime;
    switch (id) {
      case 'decay':
        this.decay = value;
        this.regenerateIR();
        break;
      case 'size':
        this.size = value;
        this.regenerateIR();
        break;
      case 'damping':
        this.damping = value;
        this.regenerateIR();
        break;
      case 'mix':
        this.wetGain.gain.linearRampToValueAtTime(value, now + PARAM_RAMP_TIME);
        this.dryGain.gain.linearRampToValueAtTime(1 - value, now + PARAM_RAMP_TIME);
        break;
    }
  }

  dispose(): void {
    this.convolverNode.disconnect();
    this.wetGain.disconnect();
    this.dryGain.disconnect();
    this.disposeBase();
  }
}
