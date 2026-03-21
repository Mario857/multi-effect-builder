import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EffectInstance, EffectParameterValue, EffectType, Preset } from '@/types/audio';
import { EFFECT_TYPE } from '@/types/audio';
import { getDefaultParameters } from '@/lib/audio/effectFactory';

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

const DEFAULT_AMP_TYPE = EFFECT_TYPE.AMP_CLEAN;

export const usePedalboardStore = create<PedalboardState & PedalboardActions>()(
  persist(
    (set, get) => ({
      ampType: DEFAULT_AMP_TYPE,
      ampParameters: getDefaultParameters(DEFAULT_AMP_TYPE),
      effects: [],
      selectedEffectId: null,
      presets: [],
      activePresetId: null,

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
          ampType: DEFAULT_AMP_TYPE,
          ampParameters: getDefaultParameters(DEFAULT_AMP_TYPE),
          effects: [],
          selectedEffectId: null,
          activePresetId: null,
        }),
    }),
    {
      name: 'multi-effect-pedalboard',
    },
  ),
);
