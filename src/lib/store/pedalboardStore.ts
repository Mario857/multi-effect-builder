import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EffectInstance, EffectParameterValue, EffectType, Preset } from '@/types/audio';
import { getDefaultParameters } from '@/lib/audio/effectFactory';
import { FACTORY_PRESETS } from '@/lib/constants/presets';

interface PedalboardState {
  ampType: EffectType;
  ampParameters: readonly EffectParameterValue[];
  effects: readonly EffectInstance[];
  selectedEffectId: string | null;
  presets: readonly Preset[];
  activePresetId: string | null;
}

interface PedalboardActions {
  setAmpType: (type: EffectType) => void;
  setAmpParameter: (id: string, value: number) => void;
  addEffect: (type: EffectType) => void;
  removeEffect: (id: string) => void;
  moveEffect: (fromIndex: number, toIndex: number) => void;
  toggleBypass: (id: string) => void;
  setEffectParameter: (effectId: string, parameterId: string, value: number) => void;
  selectEffect: (id: string | null) => void;
  savePreset: (name: string) => void;
  loadPreset: (id: string) => void;
  deletePreset: (id: string) => void;
  resetToDefaults: () => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const DEFAULT_PRESET = FACTORY_PRESETS[0];

export const usePedalboardStore = create<PedalboardState & PedalboardActions>()(
  persist(
    (set, get) => ({
      ampType: DEFAULT_PRESET.pedalboard.ampType,
      ampParameters: DEFAULT_PRESET.pedalboard.ampParameters,
      effects: DEFAULT_PRESET.pedalboard.effects,
      selectedEffectId: null,
      presets: FACTORY_PRESETS,
      activePresetId: DEFAULT_PRESET.id,

      setAmpType: (type) =>
        set({
          ampType: type,
          ampParameters: getDefaultParameters(type),
        }),

      setAmpParameter: (id, value) =>
        set((state) => ({
          ampParameters: state.ampParameters.map((p) =>
            p.id === id ? { ...p, value } : p,
          ),
        })),

      addEffect: (type) => {
        const newEffect: EffectInstance = {
          id: generateId(),
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

      selectEffect: (id) => set({ selectedEffectId: id }),

      savePreset: (name) => {
        const state = get();
        const preset: Preset = {
          id: generateId(),
          name,
          isFactory: false,
          pedalboard: {
            id: generateId(),
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
          presets: state.presets.filter((p) => p.id !== id),
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
      name: 'multi-effect-pedalboard',
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<PedalboardState & PedalboardActions> | undefined;
        if (!persistedState) return current;

        // Ensure factory presets are always present
        const persistedPresets = persistedState.presets ?? [];
        const factoryIds = new Set(FACTORY_PRESETS.map((p) => p.id));
        const userPresets = persistedPresets.filter((p) => !factoryIds.has(p.id));
        const mergedPresets = [...FACTORY_PRESETS, ...userPresets];

        return {
          ...current,
          ...persistedState,
          presets: mergedPresets,
        };
      },
    },
  ),
);
