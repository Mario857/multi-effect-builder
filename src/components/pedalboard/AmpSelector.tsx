'use client';

import { AmpParameterKnob } from '@/components/pedalboard/AmpParameterKnob';
import { Card } from '@/components/shared/Card';
import { ChipButton } from '@/components/shared/ChipButton';
import { useAmpSelector } from '@/hooks/useAmpSelector';

/** Amplifier section: amp model selector, the model's description and its knobs. */
export function AmpSelector() {
  const { ampDefinition, ampOptions } = useAmpSelector();

  const ampChips = (
    <div role="group" aria-label="Amp model" className="flex gap-1">
      {ampOptions.map((option) => (
        <ChipButton
          key={option.type}
          size="sm"
          accent="amp"
          isActive={option.isActive}
          onClick={option.handleSelect}
          aria-label={option.ariaLabel}
        >
          {option.label}
        </ChipButton>
      ))}
    </div>
  );

  const ampKnobs = ampDefinition.parameters.map((parameter) => (
    <AmpParameterKnob key={parameter.id} parameter={parameter} />
  ));

  return (
    <Card variant="glass" padding="md" title="Amplifier" accent="amp" action={ampChips}>
      <p className="text-xs text-text-muted">{ampDefinition.description}</p>
      <div className="flex flex-wrap items-center justify-center gap-4">{ampKnobs}</div>
    </Card>
  );
}
