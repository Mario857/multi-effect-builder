'use client';

import { Knob } from '@/components/shared/Knob';
import { useAmpParameterControl } from '@/hooks/useParameterControl';
import type { EffectParameterDefinition } from '@/types/audio';

/**
 * Knob bound to one parameter of the amp. It subscribes to that parameter alone, so
 * turning it re-renders nothing else.
 * @param parameter - Definition of the amp parameter the knob controls
 */
export function AmpParameterKnob({ parameter }: { parameter: EffectParameterDefinition }) {
  const { value, handleChange } = useAmpParameterControl(parameter);

  return (
    <Knob
      value={value}
      min={parameter.min}
      max={parameter.max}
      step={parameter.step}
      defaultValue={parameter.defaultValue}
      onChange={handleChange}
      label={parameter.name}
      size="md"
      unit={parameter.unit}
    />
  );
}
