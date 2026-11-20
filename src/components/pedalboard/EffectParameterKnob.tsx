'use client';

import { Knob } from '@/components/shared/Knob';
import { useEffectParameterControl } from '@/hooks/useParameterControl';
import type { EffectParameterDefinition } from '@/types/audio';

interface Props {
  /** Id of the effect instance on the board. */
  effectId: string;
  parameter: EffectParameterDefinition;
  size: 'sm' | 'md';
}

/**
 * Knob bound to one parameter of one pedal. It subscribes to that parameter alone, so
 * turning it re-renders only the knobs that show the same value (on the pedal and in
 * the parameter panel).
 */
export function EffectParameterKnob({ effectId, parameter, size }: Props) {
  const { value, handleChange } = useEffectParameterControl(effectId, parameter);

  return (
    <Knob
      value={value}
      min={parameter.min}
      max={parameter.max}
      step={parameter.step}
      defaultValue={parameter.defaultValue}
      onChange={handleChange}
      label={parameter.name}
      size={size}
      unit={parameter.unit}
    />
  );
}
