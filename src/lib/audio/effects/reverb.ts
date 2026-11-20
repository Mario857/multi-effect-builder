import { EffectNode } from '@/lib/audio/effectNode';
import { REVERB_DEFINITION } from '@/lib/constants/effects';

const IR_CHANNEL_COUNT = 2;

// Early reflection delays (in seconds) — simulates discrete wall bounces
const EARLY_REFLECTION_TAPS = [0.011, 0.019, 0.027, 0.037, 0.048, 0.063] as const;
const EARLY_REFLECTION_GAINS = [0.85, 0.72, 0.60, 0.48, 0.38, 0.28] as const;
// Size 0–1 stretches the early reflection pattern by 0.5×–2×
const SIZE_SCALE_MIN = 0.5;
const SIZE_SCALE_RANGE = 1.5;
// Right channel taps arrive slightly later and quieter for stereo width
const STEREO_OFFSET_SECONDS = 0.002;
const RIGHT_CHANNEL_TAP_GAIN = 0.95;

// The diffuse tail starts once the early reflections have played out
const TAIL_START_SECONDS = 0.07;
const TAIL_LEVEL = 0.4;
// The tail envelope falls by e^-4 (about -35 dB) over its length
const TAIL_DECAY_RATE = 4;
// Extra decay per second at full damping
const DAMPING_DECAY_RATE = 6;

// How long decay/size/damping must stay unchanged before the impulse response
// is rebuilt. Generating a multi-second impulse and swapping the convolver
// buffer (which cuts the ringing tail) on every pointer move of a knob drag
// is not viable.
const IR_REBUILD_DEBOUNCE_MS = 150;
// A reverb that has no impulse response yet is rebuilt right after the current task
const IR_INITIAL_BUILD_DELAY_MS = 0;

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
  const sampleRate = context.sampleRate;
  const length = Math.max(1, Math.floor(sampleRate * decay));
  const buffer = context.createBuffer(IR_CHANNEL_COUNT, length, sampleRate);
  const channelL = buffer.getChannelData(0);
  const channelR = buffer.getChannelData(1);

  // Phase 1: Early reflections — discrete taps for spatial depth
  const sizeScale = SIZE_SCALE_MIN + size * SIZE_SCALE_RANGE;
  const stereoOffset = Math.floor(sampleRate * STEREO_OFFSET_SECONDS);
  for (let tapIndex = 0; tapIndex < EARLY_REFLECTION_TAPS.length; tapIndex++) {
    const tapTime = EARLY_REFLECTION_TAPS[tapIndex] * sizeScale;
    const tapGain = EARLY_REFLECTION_GAINS[tapIndex];
    const tapSample = Math.floor(tapTime * sampleRate);

    if (tapSample < length) {
      // Slightly different L/R timing for stereo width
      const offsetL = tapSample;
      const offsetR = Math.min(tapSample + stereoOffset, length - 1);
      channelL[offsetL] += tapGain;
      channelR[offsetR] += tapGain * RIGHT_CHANNEL_TAP_GAIN;
    }
  }

  // Phase 2: Diffuse tail — builds after early reflections
  const tailStart = Math.floor(sampleRate * TAIL_START_SECONDS * sizeScale);
  const tailLength = decay - tailStart / sampleRate;
  // Smooth exponential decay, steepened by damping. Note that damping shortens
  // the whole tail — it is not frequency dependent.
  // Both exponentials are folded into one per-sample multiplier so the loop
  // needs no Math.exp() calls (this runs on the main thread, up to ~1M samples).
  const decayPerSecond = TAIL_DECAY_RATE / tailLength + damping * DAMPING_DECAY_RATE;
  const decayPerSample = Math.exp(-decayPerSecond / sampleRate);
  let amplitude = TAIL_LEVEL;
  for (let i = tailStart; i < length; i++) {
    channelL[i] += (Math.random() * 2 - 1) * amplitude;
    channelR[i] += (Math.random() * 2 - 1) * amplitude;
    amplitude *= decayPerSample;
  }

  return buffer;
}

/**
 * Convolution reverb using a generated impulse response.
 */
export class ReverbEffect extends EffectNode {
  private convolverNode: ConvolverNode;
  private decay: number;
  private size: number;
  private damping: number;
  private rebuildTimer: ReturnType<typeof setTimeout> | null;

  constructor(context: AudioContext) {
    super(context);

    // Placeholders until applyDefaults() below sets the real values
    this.decay = 0;
    this.size = 0;
    this.damping = 0;
    this.rebuildTimer = null;

    this.convolverNode = context.createConvolver();

    // Wet path: input → convolver → wetNode
    this.inputNode.connect(this.convolverNode);
    this.convolverNode.connect(this.wetNode);

    this.applyDefaults(REVERB_DEFINITION);
  }

  /**
   * Schedules one impulse response rebuild for any number of decay/size/damping
   * changes: a whole setParameters() batch — or a whole knob drag — regenerates once.
   */
  private scheduleImpulseRebuild(): void {
    if (this.rebuildTimer !== null) {
      clearTimeout(this.rebuildTimer);
    }

    // A freshly constructed reverb has no impulse response and stays silent
    // until it gets one, so only wait for the constructor's caller to finish
    // sending its initial parameters.
    const delay = this.convolverNode.buffer ? IR_REBUILD_DEBOUNCE_MS : IR_INITIAL_BUILD_DELAY_MS;

    this.rebuildTimer = setTimeout(() => {
      this.rebuildTimer = null;
      this.convolverNode.buffer = generateImpulseResponse(
        this.context,
        this.decay,
        this.size,
        this.damping,
      );
    }, delay);
  }

  protected applyParameter(id: string, value: number): void {
    switch (id) {
      case 'decay':
        this.decay = value;
        this.scheduleImpulseRebuild();
        break;
      case 'size':
        this.size = value;
        this.scheduleImpulseRebuild();
        break;
      case 'damping':
        this.damping = value;
        this.scheduleImpulseRebuild();
        break;
      case 'mix':
        this.setMix(value);
        break;
    }
  }

  dispose(): void {
    if (this.rebuildTimer !== null) {
      clearTimeout(this.rebuildTimer);
      this.rebuildTimer = null;
    }
    this.convolverNode.disconnect();
    this.disposeBase();
  }
}
