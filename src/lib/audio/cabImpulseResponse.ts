import type { EffectType } from '@/types/audio';
import { EFFECT_TYPE } from '@/types/audio';

// Cabinet IR duration — real cab IRs are very short (~50-100ms)
const CAB_IR_DURATION = 0.08;

/**
 * A single resonant mode of the speaker cone.
 * Real speakers have multiple mechanical resonances that color the sound.
 */
interface SpeakerMode {
  readonly freq: number;
  readonly amplitude: number;
  /** Exponential decay rate — higher = faster decay */
  readonly decay: number;
}

/**
 * A discrete early reflection from the cabinet box walls.
 * These very short reflections give each cab its "boxiness" character.
 */
interface CabReflection {
  /** Delay in seconds from the initial impulse */
  readonly delay: number;
  readonly level: number;
  /** Flip polarity on right channel for stereo width */
  readonly stereoFlip: boolean;
}

interface CabIRConfig {
  /** Direct sound level from the speaker cone center */
  readonly directLevel: number;
  /** Speaker cone resonant modes — the core character of the speaker */
  readonly modes: readonly SpeakerMode[];
  /** Cabinet box wall reflections */
  readonly reflections: readonly CabReflection[];
  /** Diffuse tail level — short reverberant energy inside the cabinet */
  readonly diffuseLevel: number;
  /** Diffuse tail decay rate */
  readonly diffuseDecay: number;
  /** Speaker rolloff frequency — nothing above this survives */
  readonly rolloffFreq: number;
  /** Rolloff steepness — higher = sharper cutoff */
  readonly rolloffSteepness: number;
  /** Mic proximity bass boost amount (0-1) */
  readonly proximityBoost: number;
  /** Proximity boost frequency */
  readonly proximityFreq: number;
}

// ── Per-amp-type cabinet configurations ──────────────────────────────

// Fender-style 1x12 open-back — bright, chimey, open sounding
const CLEAN_CAB: CabIRConfig = {
  directLevel: 0.9,
  modes: [
    { freq: 95, amplitude: 0.45, decay: 35 },   // Cone fundamental
    { freq: 220, amplitude: 0.25, decay: 50 },   // Body resonance
    { freq: 680, amplitude: 0.15, decay: 65 },   // Lower mid character
    { freq: 1800, amplitude: 0.20, decay: 80 },  // Presence peak
    { freq: 3200, amplitude: 0.12, decay: 100 },  // Upper presence — sparkle
    { freq: 4800, amplitude: 0.06, decay: 120 },  // Air/shimmer
  ],
  reflections: [
    { delay: 0.0004, level: 0.35, stereoFlip: false }, // Baffle reflection
    { delay: 0.0012, level: 0.20, stereoFlip: true },  // Back wall (open-back bounce)
    { delay: 0.0025, level: 0.10, stereoFlip: false },  // Room return
  ],
  diffuseLevel: 0.04,
  diffuseDecay: 60,
  rolloffFreq: 5800,
  rolloffSteepness: 3.5,
  proximityBoost: 0.25,
  proximityFreq: 120,
};

// Marshall-style 4x12 closed-back — punchy, mid-forward, warm
const CRUNCH_CAB: CabIRConfig = {
  directLevel: 0.85,
  modes: [
    { freq: 80, amplitude: 0.35, decay: 30 },    // Low thump
    { freq: 130, amplitude: 0.40, decay: 40 },   // Cone resonance
    { freq: 350, amplitude: 0.20, decay: 55 },   // Lower mid warmth
    { freq: 1000, amplitude: 0.22, decay: 70 },  // Mid presence — Marshall growl
    { freq: 2400, amplitude: 0.15, decay: 90 },  // Upper mid bite
    { freq: 3800, amplitude: 0.05, decay: 110 },  // Top end — rolled off
  ],
  reflections: [
    { delay: 0.0003, level: 0.40, stereoFlip: false }, // Baffle reflection
    { delay: 0.0008, level: 0.30, stereoFlip: true },  // Closed-back pressure wave
    { delay: 0.0015, level: 0.18, stereoFlip: false },  // Internal reflection
    { delay: 0.0028, level: 0.08, stereoFlip: true },   // Secondary bounce
  ],
  diffuseLevel: 0.06,
  diffuseDecay: 50,
  rolloffFreq: 4800,
  rolloffSteepness: 4.0,
  proximityBoost: 0.35,
  proximityFreq: 100,
};

// Mesa-style 4x12 closed-back — tight, focused, aggressive
const HIGHGAIN_CAB: CabIRConfig = {
  directLevel: 0.80,
  modes: [
    { freq: 70, amplitude: 0.30, decay: 25 },    // Sub thump — tight, fast decay
    { freq: 110, amplitude: 0.42, decay: 35 },   // Cone resonance
    { freq: 400, amplitude: 0.18, decay: 60 },   // Lower mid — scooped
    { freq: 750, amplitude: 0.25, decay: 75 },   // Mid focus — Mesa character
    { freq: 2000, amplitude: 0.18, decay: 85 },  // Presence — cut
    { freq: 3200, amplitude: 0.04, decay: 110 },  // Top — heavily rolled
  ],
  reflections: [
    { delay: 0.0002, level: 0.45, stereoFlip: false }, // Tight baffle
    { delay: 0.0007, level: 0.35, stereoFlip: true },  // Closed-back slam
    { delay: 0.0013, level: 0.20, stereoFlip: false },  // Internal
    { delay: 0.0022, level: 0.10, stereoFlip: true },   // Secondary
  ],
  diffuseLevel: 0.05,
  diffuseDecay: 55,
  rolloffFreq: 4400,
  rolloffSteepness: 4.5,
  proximityBoost: 0.30,
  proximityFreq: 90,
};

// Full-range acoustic sim — transparent PA/FRFR speaker
const ACOUSTIC_CAB: CabIRConfig = {
  directLevel: 0.95,
  modes: [
    { freq: 110, amplitude: 0.20, decay: 40 },   // Gentle low-end warmth
    { freq: 300, amplitude: 0.12, decay: 55 },   // Body
    { freq: 1200, amplitude: 0.10, decay: 70 },  // Mid clarity
    { freq: 3500, amplitude: 0.08, decay: 85 },  // Presence
    { freq: 6000, amplitude: 0.05, decay: 100 },  // Air
    { freq: 8500, amplitude: 0.03, decay: 120 },  // Shimmer
  ],
  reflections: [
    { delay: 0.0005, level: 0.15, stereoFlip: false },
    { delay: 0.0015, level: 0.08, stereoFlip: true },
  ],
  diffuseLevel: 0.02,
  diffuseDecay: 70,
  rolloffFreq: 8000,
  rolloffSteepness: 2.5,
  proximityBoost: 0.15,
  proximityFreq: 150,
};

const CAB_CONFIGS: Record<string, CabIRConfig> = {
  [EFFECT_TYPE.AMP_CLEAN]: CLEAN_CAB,
  [EFFECT_TYPE.AMP_CRUNCH]: CRUNCH_CAB,
  [EFFECT_TYPE.AMP_HIGHGAIN]: HIGHGAIN_CAB,
  [EFFECT_TYPE.AMP_ACOUSTIC]: ACOUSTIC_CAB,
};

/**
 * Attempt to generate the IR using OfflineAudioContext for sample-accurate
 * filtering. Falls back to time-domain synthesis if not available.
 */
export function generateCabIR(context: AudioContext, ampType: EffectType): AudioBuffer {
  const config = CAB_CONFIGS[ampType] ?? CAB_CONFIGS[EFFECT_TYPE.AMP_CLEAN];
  const sampleRate = context.sampleRate;
  const length = Math.floor(sampleRate * CAB_IR_DURATION);
  const buffer = context.createBuffer(2, length, sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);

    // 1. Direct impulse — the initial transient from the speaker cone
    data[0] = config.directLevel;

    // 2. Speaker cone resonant modes — damped sinusoids
    // Each mode represents a mechanical resonance of the speaker/cabinet system.
    // Slight stereo detuning (0.3%) gives natural width without phasiness.
    const stereoDetune = ch === 1 ? 1.003 : 1;
    for (const mode of config.modes) {
      const freq = mode.freq * stereoDetune;
      const omega = 2 * Math.PI * freq / sampleRate;
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        data[i] += mode.amplitude * Math.sin(omega * i) * Math.exp(-t * mode.decay);
      }
    }

    // 3. Cabinet box reflections — discrete taps at very short delays
    // These give the "boxiness" and spatial character of the cabinet
    for (const ref of config.reflections) {
      const sample = Math.floor(ref.delay * sampleRate);
      if (sample < length) {
        const polarity = ref.stereoFlip && ch === 1 ? -1 : 1;
        data[sample] += ref.level * polarity;
      }
    }

    // 4. Short diffuse tail — residual cabinet resonance
    // Much shorter and drier than reverb — this is box coloring, not ambience
    const diffuseStart = Math.floor(sampleRate * 0.002);
    for (let i = diffuseStart; i < length; i++) {
      const t = (i - diffuseStart) / sampleRate;
      const env = Math.exp(-t * config.diffuseDecay);
      data[i] += (Math.random() * 2 - 1) * config.diffuseLevel * env;
    }

    // 5. Mic proximity effect — bass boost for close-mic simulation
    // Simple one-pole lowpass accumulator adds low-end weight
    if (config.proximityBoost > 0) {
      const proxCoeff = 1 - Math.exp(-2 * Math.PI * config.proximityFreq / sampleRate);
      let proxAccum = 0;
      for (let i = 0; i < length; i++) {
        proxAccum += proxCoeff * (data[i] - proxAccum);
        data[i] += proxAccum * config.proximityBoost;
      }
    }

    // 6. Speaker rolloff — nothing above the cutoff survives
    // Simple one-pole lowpass applied repeatedly for steepness
    const passes = Math.round(config.rolloffSteepness);
    const rollCoeff = 1 - Math.exp(-2 * Math.PI * config.rolloffFreq / sampleRate);
    for (let p = 0; p < passes; p++) {
      let prev = 0;
      for (let i = 0; i < length; i++) {
        prev += rollCoeff * (data[i] - prev);
        data[i] = prev;
      }
    }

    // 7. Normalize — prevent clipping while preserving relative balance
    let peak = 0;
    for (let i = 0; i < length; i++) {
      const abs = Math.abs(data[i]);
      if (abs > peak) peak = abs;
    }
    if (peak > 0) {
      const scale = 0.9 / peak;
      for (let i = 0; i < length; i++) {
        data[i] *= scale;
      }
    }
  }

  return buffer;
}
