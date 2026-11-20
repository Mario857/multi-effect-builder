'use client';

import { EFFECT_DEFINITIONS } from '@/lib/constants/effects';
import { usePedalboardStore } from '@/lib/store/pedalboardStore';
import type { EffectDefinition } from '@/types/audio';

/** The pedal whose parameters the panel shows. */
export interface SelectedEffect {
  readonly id: string;
  readonly definition: EffectDefinition;
}

/** State and handlers of the parameter panel. */
export interface ParameterPanelState {
  /** Null when no pedal is selected. */
  readonly selectedEffect: SelectedEffect | null;
  readonly handleReset: () => void;
}

/**
 * State of the parameter panel. Subscribes to which pedal is selected and to its type
 * only — the panel's knobs subscribe to their own values (see `useEffectParameterControl`).
 * @returns The selected pedal, if any, and the handler that resets its parameters
 */
export function useParameterPanel(): ParameterPanelState {
  const selectedEffectId = usePedalboardStore((state) => state.selectedEffectId);
  const selectedType = usePedalboardStore(
    (state) => state.effects.find((effect) => effect.id === state.selectedEffectId)?.type,
  );
  const resetEffectParameters = usePedalboardStore((state) => state.resetEffectParameters);

  const selectedEffect =
    selectedEffectId !== null && selectedType !== undefined
      ? { id: selectedEffectId, definition: EFFECT_DEFINITIONS[selectedType] }
      : null;

  const handleReset = () => {
    if (selectedEffectId !== null) resetEffectParameters(selectedEffectId);
  };

  return { selectedEffect, handleReset };
}
