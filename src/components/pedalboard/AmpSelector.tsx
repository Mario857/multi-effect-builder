'use client';

import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import { Knob } from '@/components/shared/Knob';
import { EFFECT_DEFINITIONS, AMP_TYPES } from '@/lib/constants/effects';
import { usePedalboardStore } from '@/lib/store/pedalboardStore';
import type { EffectType } from '@/types/audio';

export function AmpSelector() {
  const { ampType, ampParameters, setAmpType, setAmpParameter } = usePedalboardStore();

  const ampDefinition = EFFECT_DEFINITIONS[ampType];
  const parameterValues = new Map(ampParameters.map((p) => [p.id, p.value]));

  return (
    <div
      className={mergeClassNames(
        'flex flex-col gap-3 rounded-xl border-2 border-fx-amp/50 p-4',
        'bg-bg-surface',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-fx-amp">
          Amplifier
        </span>
        <div className="flex gap-1">
          {AMP_TYPES.map((type) => {
            const def = EFFECT_DEFINITIONS[type];
            const isActive = type === ampType;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setAmpType(type as EffectType)}
                aria-label={`Select ${def.name}`}
                className={mergeClassNames(
                  'rounded-md px-2 py-1 text-xs font-medium',
                  'transition-all duration-150 ease-out',
                  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary',
                  isActive
                    ? 'bg-fx-amp text-text-inverse'
                    : 'bg-bg-elevated text-text-secondary hover:text-text-primary',
                )}
              >
                {def.name.replace(' Amp', '').replace(' Sim', '')}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-text-muted">{ampDefinition.description}</p>

      <div className="flex items-center justify-center gap-4">
        {ampDefinition.parameters.map((paramDef) => {
          const value = parameterValues.get(paramDef.id) ?? paramDef.defaultValue;
          return (
            <Knob
              key={paramDef.id}
              value={value}
              min={paramDef.min}
              max={paramDef.max}
              step={paramDef.step}
              onChange={(v) => setAmpParameter(paramDef.id, v)}
              label={paramDef.name}
              size="md"
              unit={paramDef.unit}
            />
          );
        })}
      </div>
    </div>
  );
}
