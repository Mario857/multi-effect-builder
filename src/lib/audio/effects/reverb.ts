import { EffectNode } from '@/lib/audio/effectNode';

const PARAM_RAMP_TIME = 0.02;
const IR_SAMPLE_RATE = 44100;

/**
 * Generates an impulse response buffer for convolution reverb.
 * Uses exponential decay with high-frequency damping.
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

  for (let i = 0; i < length; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-t * (3 / decay));
    // High-frequency damping: faster decay for higher frequencies via noise shaping
    const dampingFactor = 1 - damping * (t / decay);
    const amplitude = envelope * Math.max(0, dampingFactor);
    // Size affects early vs late reflection density
    const sizeScale = 0.5 + size * 0.5;
    channelL[i] = (Math.random() * 2 - 1) * amplitude * sizeScale;
    channelR[i] = (Math.random() * 2 - 1) * amplitude * sizeScale;
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
