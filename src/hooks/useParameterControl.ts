'use client';

import { useCallback } from 'react';
import { usePedalboardStore } from '@/lib/store/pedalboardStore';
import type { EffectParameterDefinition } from '@/types/audio';

/** What a control needs to display and change one parameter. */
export interface ParameterControl {
  readonly value: number;
  /** Stable for the life of the control, so a memoised knob is not re-rendered by its parent. */
  readonly handleChange: (value: number) => void;
}

/**
 * Binds a control to one parameter of the amp. The component that calls it subscribes
 * to that single value, so turning one knob re-renders nothing but that knob.
 * @param parameter - Definition of the amp parameter
 * @returns The current value and a stable change handler
 */
export function useAmpParameterControl(parameter: EffectParameterDefinition): ParameterControl {
  const value = usePedalboardStore(
    (state) => state.ampParameters.find((entry) => entry.id === parameter.id)?.value,
  );
  const setAmpParameter = usePedalboardStore((state) => state.setAmpParameter);

  const handleChange = useCallback(
    (nextValue: number) => {
      setAmpParameter(parameter.id, nextValue);
    },
    [parameter.id, setAmpParameter],
  );

  return { value: value ?? parameter.defaultValue, handleChange };
}

/**
 * Binds a control to one parameter of one pedal. The component that calls it subscribes
 * to that single value, so turning one knob re-renders nothing but the controls showing it.
 * @param effectId - Id of the effect instance on the board
 * @param parameter - Definition of the parameter
 * @returns The current value and a stable change handler
 */
export function useEffectParameterControl(
  effectId: string,
  parameter: EffectParameterDefinition,
): ParameterControl {
  // The lookup is undefined for an instant when the effect has just been removed: the store
  // notifies this subscriber before React unmounts the control.
  const value = usePedalboardStore(
    (state) =>
      state.effects
        .find((effect) => effect.id === effectId)
        ?.parameters.find((entry) => entry.id === parameter.id)?.value,
  );
  const setEffectParameter = usePedalboardStore((state) => state.setEffectParameter);

  const handleChange = useCallback(
    (nextValue: number) => {
      setEffectParameter(effectId, parameter.id, nextValue);
    },
    [effectId, parameter.id, setEffectParameter],
  );

  return { value: value ?? parameter.defaultValue, handleChange };
}
