'use client';

import { RotateCcw } from 'lucide-react';
import { EffectParameterKnob } from '@/components/pedalboard/EffectParameterKnob';
import { Badge } from '@/components/shared/Badge';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { useParameterPanel } from '@/hooks/useParameterPanel';

/** Panel with a knob for every parameter of the selected pedal. Renders nothing when none is selected. */
export function ParameterPanel() {
  const { selectedEffect, handleReset } = useParameterPanel();

  if (!selectedEffect) return null;

  const { id, definition } = selectedEffect;

  const title = (
    <div className="flex items-center gap-2">
      <h2>
        <Badge variant={definition.category} appearance="tag">
          {definition.name}
        </Badge>
      </h2>
      <span className="text-xs text-text-muted">{definition.description}</span>
    </div>
  );

  const resetButton = (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleReset}
      aria-label={`Reset ${definition.name} parameters to defaults`}
    >
      <RotateCcw className="h-3.5 w-3.5" />
      Reset
    </Button>
  );

  const parameterKnobs = definition.parameters.map((parameter) => (
    <EffectParameterKnob key={parameter.id} effectId={id} parameter={parameter} size="md" />
  ));

  return (
    <Card variant="glass" padding="md" title={title} action={resetButton}>
      <div className="flex flex-wrap items-start justify-center gap-6">{parameterKnobs}</div>
    </Card>
  );
}
