import type {
  EffectInstance,
  EffectParameterValue,
  EffectType,
  PedalboardSignalPath,
  PersistedPedalboard,
  Preset,
} from '@/types/audio';
import { AMP_TYPES, EFFECT_DEFINITIONS, PEDAL_EFFECT_TYPES } from '@/lib/constants/effects';
import { FACTORY_PRESETS } from '@/lib/constants/presets';
import { clamp } from '@/lib/helpers/clamp';
import { isRecord } from '@/lib/helpers/isRecord';

// Array.isArray narrows `unknown` to `any[]`; the annotation keeps the elements `unknown`
function toUnknownArray(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : [];
}

/**
 * Rebuilds a parameter list from the effect's current definition: unknown ids are
 * dropped, missing or non-numeric values fall back to the default, and values are
 * clamped to the defined range. This keeps data saved before a definition changed usable.
 */
function sanitizeParameters(type: EffectType, value: unknown): readonly EffectParameterValue[] {
  const storedValues = new Map<string, number>();
  for (const entry of toUnknownArray(value)) {
    if (isRecord(entry) && typeof entry.id === 'string' && typeof entry.value === 'number') {
      storedValues.set(entry.id, entry.value);
    }
  }

  return EFFECT_DEFINITIONS[type].parameters.map((definition) => {
    const stored = storedValues.get(definition.id);
    const isUsable = stored !== undefined && Number.isFinite(stored);
    return {
      id: definition.id,
      value: isUsable ? clamp(stored, definition.min, definition.max) : definition.defaultValue,
    };
  });
}

function sanitizeEffects(value: unknown): readonly EffectInstance[] | null {
  if (!Array.isArray(value)) return null;

  const seenIds = new Set<string>();
  const effects: EffectInstance[] = [];
  for (const entry of toUnknownArray(value)) {
    if (!isRecord(entry)) continue;

    const { id } = entry;
    const type = PEDAL_EFFECT_TYPES.find((candidate) => candidate === entry.type);
    // Ids key both React lists and audio nodes, so a duplicate would alias two pedals
    if (typeof id !== 'string' || id === '' || seenIds.has(id) || type === undefined) continue;

    seenIds.add(id);
    effects.push({
      id,
      type,
      isBypassed: entry.isBypassed === true,
      parameters: sanitizeParameters(type, entry.parameters),
    });
  }
  return effects;
}

/**
 * Repairs the amp and the effect chain independently, so one unusable part
 * (e.g. an amp model that no longer exists) does not discard the other.
 */
function sanitizeSignalPath(
  value: Record<string, unknown>,
  fallback: PedalboardSignalPath,
): PedalboardSignalPath {
  const ampType = AMP_TYPES.find((candidate) => candidate === value.ampType);

  return {
    ampType: ampType ?? fallback.ampType,
    ampParameters: ampType === undefined
      ? fallback.ampParameters
      : sanitizeParameters(ampType, value.ampParameters),
    effects: sanitizeEffects(value.effects) ?? fallback.effects,
  };
}

function sanitizeUserPresets(value: unknown, fallback: PedalboardSignalPath): readonly Preset[] {
  // Factory presets always come from the constants, never from storage
  const seenIds = new Set(FACTORY_PRESETS.map((preset) => preset.id));
  const presets: Preset[] = [];

  for (const entry of toUnknownArray(value)) {
    if (!isRecord(entry)) continue;

    const { id, name, pedalboard } = entry;
    if (typeof id !== 'string' || id === '' || seenIds.has(id)) continue;
    if (typeof name !== 'string' || !isRecord(pedalboard)) continue;

    seenIds.add(id);
    presets.push({
      id,
      name,
      isFactory: false,
      pedalboard: {
        id: typeof pedalboard.id === 'string' ? pedalboard.id : id,
        name,
        // A preset without a usable effect list is an amp-only preset, not a copy of the fallback board
        ...sanitizeSignalPath(pedalboard, { ...fallback, effects: [] }),
      },
    });
  }
  return presets;
}

/**
 * Validates pedalboard data read from localStorage, which may be stale (saved by an
 * older version of the app), hand-edited or corrupt. Anything that no longer matches
 * the current effect definitions is dropped or repaired so the UI and the audio
 * engine never see an unknown effect type, a missing parameter or an out-of-range value.
 * @param persisted - The untrusted value read from storage
 * @param fallback - What to use for the board when the stored board is unusable
 * @returns A fully valid persisted state
 */
export function sanitizePersistedPedalboard(
  persisted: unknown,
  fallback: PersistedPedalboard,
): PersistedPedalboard {
  if (!isRecord(persisted)) return fallback;

  const signalPath = sanitizeSignalPath(persisted, fallback);
  const presets = sanitizeUserPresets(persisted.presets, fallback);
  const { activePresetId } = persisted;
  const isKnownPreset = [...FACTORY_PRESETS, ...presets].some((preset) => preset.id === activePresetId);

  return {
    ampType: signalPath.ampType,
    ampParameters: signalPath.ampParameters,
    effects: signalPath.effects,
    presets,
    activePresetId: typeof activePresetId === 'string' && isKnownPreset ? activePresetId : null,
  };
}
