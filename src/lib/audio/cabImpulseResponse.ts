import type { EffectType } from '@/types/audio';
import { EFFECT_TYPE } from '@/types/audio';

// Cab IR file paths — MIT-licensed from WebAudio-Guitar-Amplifier-Simulator-3
const CAB_IR_PATHS: Record<string, string> = {
  [EFFECT_TYPE.AMP_CLEAN]: '/ir/fender-clean.wav',
  [EFFECT_TYPE.AMP_CRUNCH]: '/ir/marshall-crunch.wav',
  [EFFECT_TYPE.AMP_HIGHGAIN]: '/ir/marshall-highgain.wav',
  [EFFECT_TYPE.AMP_ACOUSTIC]: '/ir/vox-bright.wav',
};

// Cache decoded IR buffers — same IR can be reused across amp instances
const irCache = new Map<string, AudioBuffer>();

/**
 * Loads and decodes a cabinet impulse response WAV file.
 * Results are cached so repeated loads of the same IR are instant.
 */
export async function loadCabIR(
  context: AudioContext,
  ampType: EffectType,
): Promise<AudioBuffer | null> {
  const path = CAB_IR_PATHS[ampType];
  if (!path) return null;

  // Return cached buffer if available
  const cached = irCache.get(path);
  if (cached) return cached;

  try {
    const response = await fetch(path);
    if (!response.ok) return null;

    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await context.decodeAudioData(arrayBuffer);
    irCache.set(path, audioBuffer);
    return audioBuffer;
  } catch {
    return null;
  }
}

/**
 * Preloads all cabinet IRs into the cache.
 * Call once during engine startup so IR assignment is synchronous later.
 */
export async function preloadAllCabIRs(context: AudioContext): Promise<void> {
  const loads = Object.values(CAB_IR_PATHS).map(async (path) => {
    if (irCache.has(path)) return;

    try {
      const response = await fetch(path);
      if (!response.ok) return;

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await context.decodeAudioData(arrayBuffer);
      irCache.set(path, audioBuffer);
    } catch {
      // Silent fail — filter chain fallback will be used
    }
  });

  await Promise.all(loads);
}

/**
 * Gets a cached cab IR buffer synchronously. Returns null if not loaded.
 */
export function getCachedCabIR(ampType: EffectType): AudioBuffer | null {
  const path = CAB_IR_PATHS[ampType];
  if (!path) return null;
  return irCache.get(path) ?? null;
}
