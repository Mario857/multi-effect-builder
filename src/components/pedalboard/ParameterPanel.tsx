'use client';

import { RotateCcw } from 'lucide-react';
import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import { Knob } from '@/components/shared/Knob';
import { Slider } from '@/components/shared/Slider';
import { Button } from '@/components/shared/Button';
import { EFFECT_DEFINITIONS } from '@/lib/constants/effects';
import { CATEGORY_COLORS, CATEGORY_BG_COLORS } from '@/lib/constants/ui';
import { usePedalboardStore } from '@/lib/store/pedalboardStore';
import { getDefaultParameters } from '@/lib/audio/effectFactory';

const KNOB_THRESHOLD = 6;

export function ParameterPanel() {
  const { effects, selectedEffectId, setEffectParameter } = usePedalboardStore();

  const selectedEffect = effects.find((e) => e.id === selectedEffectId);
  if (!selectedEffect) return null;

  const definition = EFFECT_DEFINITIONS[selectedEffect.type];
  if (!definition) return null;

  const categoryColor = CATEGORY_COLORS[definition.category];
  const categoryBg = CATEGORY_BG_COLORS[definition.category];
  const parameterValues = new Map(selectedEffect.parameters.map((p) => [p.id, p.value]));

  const handleReset = () => {
    const defaults = getDefaultParameters(selectedEffect.type);
    for (const param of defaults) {
      setEffectParameter(selectedEffect.id, param.id, param.value);
    }
  };

  // Use knobs for fewer params, sliders for many
  const useSliders = definition.parameters.length > KNOB_THRESHOLD;

  const parameterControls = definition.parameters.map((paramDef) => {
    const value = parameterValues.get(paramDef.id) ?? paramDef.defaultValue;

    if (useSliders) {
      return (
        <div key={paramDef.id} className="flex items-center gap-3">
          <span className="w-20 text-xs text-text-secondary">{paramDef.name}</span>
          <Slider
            value={value}
            min={paramDef.min}
            max={paramDef.max}
            step={paramDef.step}
            onChange={(v) => setEffectParameter(selectedEffect.id, paramDef.id, v)}
            aria-label={paramDef.name}
            className="flex-1"
          />
          <span className="w-16 text-right text-xs font-mono text-text-muted">
            {value.toFixed(paramDef.step < 1 ? 2 : 0)}{paramDef.unit}
          </span>
        </div>
      );
    }

    return (
      <Knob
        key={paramDef.id}
        value={value}
        min={paramDef.min}
        max={paramDef.max}
        step={paramDef.step}
        onChange={(v) => setEffectParameter(selectedEffect.id, paramDef.id, v)}
        label={paramDef.name}
        size="md"
        unit={paramDef.unit}
      />
    );
  });

  return (
    <div
      className={mergeClassNames(
        'rounded-xl p-4',
        'glass-card card-highlight',
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={mergeClassNames(
              'inline-flex rounded-md px-2 py-0.5 text-xs font-bold uppercase',
              categoryBg,
              categoryColor,
            )}
          >
            {definition.name}
          </span>
          <span className="text-xs text-text-muted">{definition.description}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset} aria-label="Reset parameters to defaults">
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
      </div>

      <div
        className={mergeClassNames(
          useSliders ? 'flex flex-col gap-3' : 'flex flex-wrap items-start justify-center gap-6',
        )}
      >
        {parameterControls}
      </div>
    </div>
  );
}
