import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AmpType,
  EffectInstance,
  EffectParameterValue,
  PedalEffectType,
  PersistedPedalboard,
  Preset,
} from '@/types/audio';
import { FACTORY_PRESETS } from '@/lib/constants/presets';
import {
  PEDALBOARD_STORAGE_KEY,
  PEDALBOARD_STORAGE_VERSION,
  STORAGE_WRITE_THROTTLE_MS,
} from '@/lib/constants/storage';
import { createThrottledStorage } from '@/lib/helpers/createThrottledStorage';
import { getDefaultParameters } from '@/lib/helpers/getDefaultParameters';
import { sanitizePersistedPedalboard } from '@/lib/helpers/sanitizePedalboard';

interface PedalboardState {
  ampType: AmpType;
  ampParameters: readonly EffectParameterValue[];
  effects: readonly EffectInstance[];
  selectedEffectId: string | null;
  presets: readonly Preset[];
  activePresetId: string | null;
}

interface PedalboardActions {
  setAmpType: (type: AmpType) => void;
  setAmpParameter: (id: string, value: number) => void;
  addEffect: (type: PedalEffectType) => void;
  removeEffect: (id: string) => void;
  moveEffect: (fromIndex: number, toIndex: number) => void;
  toggleBypass: (id: string) => void;
  setEffectParameter: (effectId: string, parameterId: string, value: number) => void;
  resetEffectParameters: (effectId: string) => void;
  selectEffect: (id: string | null) => void;
  savePreset: (name: string) => void;
  loadPreset: (id: string) => void;
  deletePreset: (id: string) => void;
  resetToDefaults: () => void;
}

const DEFAULT_PRESET = FACTORY_PRESETS[0];

/**
 * The pedalboard: active amp, ordered effect chain, selection and presets.
 * This is the single source of truth for the sound — the audio graph is derived
 * from it by the engine controller. All updates are immutable, which is what
 * lets the audio layer find changes by comparing references.
 *
 * The board, the user presets and the active preset id are persisted to
 * localStorage (throttled, validated on load).
 */
export const usePedalboardStore = create<PedalboardState & PedalboardActions>()(
  persist(
    (set, get) => ({
      ampType: DEFAULT_PRESET.pedalboard.ampType,
      ampParameters: DEFAULT_PRESET.pedalboard.ampParameters,
      effects: DEFAULT_PRESET.pedalboard.effects,
      selectedEffectId: null,
      presets: FACTORY_PRESETS,
      activePresetId: DEFAULT_PRESET.id,

      setAmpType: (type) => {
        // Re-selecting the active amp must not wipe its knob settings
        if (type === get().ampType) return;
        set({
          ampType: type,
          ampParameters: getDefaultParameters(type),
        });
      },

      setAmpParameter: (id, value) =>
        set((state) => ({
          ampParameters: state.ampParameters.map((p) =>
            p.id === id ? { ...p, value } : p,
          ),
        })),

      addEffect: (type) => {
        const newEffect: EffectInstance = {
          id: crypto.randomUUID(),
          type,
          isBypassed: false,
          parameters: getDefaultParameters(type),
        };
        set((state) => ({
          effects: [...state.effects, newEffect],
          selectedEffectId: newEffect.id,
        }));
      },

      removeEffect: (id) =>
        set((state) => ({
          effects: state.effects.filter((e) => e.id !== id),
          selectedEffectId: state.selectedEffectId === id ? null : state.selectedEffectId,
        })),

      moveEffect: (fromIndex, toIndex) =>
        set((state) => {
          const isOnBoard = (index: number) =>
            Number.isInteger(index) && index >= 0 && index < state.effects.length;
          // Returning the same state object makes this a no-op (no notification, no persist churn)
          if (!isOnBoard(fromIndex) || !isOnBoard(toIndex) || fromIndex === toIndex) return state;

          const newEffects = [...state.effects];
          const [moved] = newEffects.splice(fromIndex, 1);
          newEffects.splice(toIndex, 0, moved);
          return { effects: newEffects };
        }),

      toggleBypass: (id) =>
        set((state) => ({
          effects: state.effects.map((e) =>
            e.id === id ? { ...e, isBypassed: !e.isBypassed } : e,
          ),
        })),

      setEffectParameter: (effectId, parameterId, value) =>
        set((state) => ({
          effects: state.effects.map((e) =>
            e.id === effectId
              ? {
                  ...e,
                  parameters: e.parameters.map((p) =>
                    p.id === parameterId ? { ...p, value } : p,
                  ),
                }
              : e,
          ),
        })),

      resetEffectParameters: (effectId) =>
        set((state) => ({
          effects: state.effects.map((e) =>
            e.id === effectId ? { ...e, parameters: getDefaultParameters(e.type) } : e,
          ),
        })),

      selectEffect: (id) => {
        // A click that removes a pedal can still bubble into a select for the same id —
        // never point the selection at an effect that is not on the board
        if (id !== null && !get().effects.some((e) => e.id === id)) return;
        set({ selectedEffectId: id });
      },

      savePreset: (name) => {
        const state = get();
        const preset: Preset = {
          id: crypto.randomUUID(),
          name,
          isFactory: false,
          pedalboard: {
            id: crypto.randomUUID(),
            name,
            ampType: state.ampType,
            ampParameters: state.ampParameters,
            effects: state.effects,
          },
        };
        set((state) => ({
          presets: [...state.presets, preset],
          activePresetId: preset.id,
        }));
      },

      loadPreset: (id) => {
        const state = get();
        const preset = state.presets.find((p) => p.id === id);
        if (!preset) return;
        set({
          ampType: preset.pedalboard.ampType,
          ampParameters: preset.pedalboard.ampParameters,
          effects: preset.pedalboard.effects,
          selectedEffectId: null,
          activePresetId: id,
        });
      },

      deletePreset: (id) =>
        set((state) => ({
          // Factory presets are permanent, whatever the caller asks for
          presets: state.presets.filter((p) => p.id !== id || p.isFactory),
          activePresetId: state.activePresetId === id ? null : state.activePresetId,
        })),

      resetToDefaults: () =>
        set({
          ampType: DEFAULT_PRESET.pedalboard.ampType,
          ampParameters: DEFAULT_PRESET.pedalboard.ampParameters,
          effects: DEFAULT_PRESET.pedalboard.effects,
          selectedEffectId: null,
          activePresetId: DEFAULT_PRESET.id,
        }),
    }),
    {
      name: PEDALBOARD_STORAGE_KEY,
      version: PEDALBOARD_STORAGE_VERSION,
      storage: createThrottledStorage(STORAGE_WRITE_THROTTLE_MS),

      // Persist only what must survive a reload. Factory presets are constants and the
      // selection is transient UI state — writing them on every knob move is wasted work.
      partialize: (state): PersistedPedalboard => ({
        ampType: state.ampType,
        ampParameters: state.ampParameters,
        effects: state.effects,
        presets: state.presets.filter((p) => !p.isFactory),
        activePresetId: state.activePresetId,
      }),

      // Version 0 data is a superset of the current shape and `merge` validates every
      // field anyway, so older data needs no transformation — it only must not be discarded.
      migrate: (persisted) => persisted,

      merge: (persisted, current) => {
        const restored = sanitizePersistedPedalboard(persisted, {
          ampType: current.ampType,
          ampParameters: current.ampParameters,
          effects: current.effects,
          presets: [],
          activePresetId: current.activePresetId,
        });

        return {
          ...current,
          ...restored,
          // Ensure factory presets are always present
          presets: [...FACTORY_PRESETS, ...restored.presets],
        };
      },
    },
  ),
);
