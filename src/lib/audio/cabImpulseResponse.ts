import type { AmpType, EffectType } from '@/types/audio';
import { EFFECT_TYPE } from '@/types/audio';
import { AMP_TYPES } from '@/lib/constants/effects';

// Cab IR file paths — MIT-licensed from WebAudio-Guitar-Amplifier-Simulator-3
const CAB_IR_PATHS: Record<AmpType, string> = {
  [EFFECT_TYPE.AMP_CLEAN]: '/ir/fender-clean.wav',
  [EFFECT_TYPE.AMP_CRUNCH]: '/ir/marshall-crunch.wav',
  [EFFECT_TYPE.AMP_HIGHGAIN]: '/ir/marshall-highgain.wav',
  [EFFECT_TYPE.AMP_ACOUSTIC]: '/ir/vox-bright.wav',
};

// Cache decoded IR buffers — same IR can be reused across amp instances
const irCache = new Map<EffectType, AudioBuffer>();

// Sample rate the cached buffers were decoded at. decodeAudioData resamples to the
// decoding context's rate and a ConvolverNode throws on a buffer at any other rate,
// so the cache is only valid for contexts running at this rate.
let irCacheSampleRate: number | null = null;

/**
 * Preloads all cabinet IRs into the cache.
 * Call once during engine startup so IR assignment is synchronous later.
 * Buffers decoded by an earlier engine run are reused when the sample rate still
 * matches and discarded when it does not (e.g. the output device changed).
 * @param context - The context the IRs will be used in
 */
export async function preloadAllCabIRs(context: BaseAudioContext): Promise<void> {
  if (irCacheSampleRate !== context.sampleRate) {
    irCache.clear();
    irCacheSampleRate = context.sampleRate;
  }

  const loads = AMP_TYPES.map(async (ampType) => {
    if (irCache.has(ampType)) return;

    try {
      const response = await fetch(CAB_IR_PATHS[ampType]);
      if (!response.ok) return;

      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await context.decodeAudioData(arrayBuffer);
      // A restart at another sample rate may have retargeted the cache while this was loading
      if (audioBuffer.sampleRate === irCacheSampleRate) {
        irCache.set(ampType, audioBuffer);
      }
    } catch {
      // Silent fail — filter chain fallback will be used
    }
  });

  await Promise.all(loads);
}

/**
 * Gets a cached cab IR buffer synchronously. Returns null if not loaded
 * (or when the type is not an amp model — pedals have no cabinet).
 */
export function getCachedCabIR(ampType: EffectType): AudioBuffer | null {
  return irCache.get(ampType) ?? null;
}
