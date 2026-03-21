'use client';

import { Power, X } from 'lucide-react';
import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import { Knob } from '@/components/shared/Knob';
import { IconButton } from '@/components/shared/IconButton';
import { EFFECT_DEFINITIONS } from '@/lib/constants/effects';
import { CATEGORY_COLORS, CATEGORY_BG_COLORS } from '@/lib/constants/ui';
import type { EffectInstance } from '@/types/audio';

const VISIBLE_PARAMS_COUNT = 3;

interface Props {
  effect: EffectInstance;
  isSelected: boolean;
  onSelect: () => void;
  onToggleBypass: () => void;
  onRemove: () => void;
  onParameterChange: (parameterId: string, value: number) => void;
}

export function EffectPedal({
  effect,
  isSelected,
  onSelect,
  onToggleBypass,
  onRemove,
  onParameterChange,
}: Props) {
  const definition = EFFECT_DEFINITIONS[effect.type];
  if (!definition) return null;

  const categoryColor = CATEGORY_COLORS[definition.category];
  const categoryBg = CATEGORY_BG_COLORS[definition.category];
  const visibleParams = definition.parameters.slice(0, VISIBLE_PARAMS_COUNT);

  const parameterValues = new Map(effect.parameters.map((p) => [p.id, p.value]));

  const ledIndicator = effect.isBypassed ? (
    <span className="h-2.5 w-2.5 rounded-full bg-text-muted/30" />
  ) : (
    <span className="h-2.5 w-2.5 rounded-full bg-status-success shadow-(--shadow-glow-amber)" />
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelect(); }}
      aria-label={`${definition.name} effect pedal`}
      className={mergeClassNames(
        'relative flex flex-col items-center gap-3',
        'w-44 rounded-xl border-2 p-3',
        'transition-all duration-150 ease-out',
        'cursor-pointer select-none',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary',
        categoryBg,
        isSelected ? `${categoryColor} shadow-(--shadow-pedal)` : 'border-border-default',
        effect.isBypassed && 'opacity-60',
      )}
    >
      <div className="absolute right-1.5 top-1.5">
        <IconButton
          aria-label={`Remove ${definition.name}`}
          size="sm"
          onClick={onRemove}
        >
          <X className="h-3 w-3" />
        </IconButton>
      </div>

      <div className="flex items-center gap-2">
        {ledIndicator}
        <span className={mergeClassNames('text-xs font-bold uppercase tracking-wider', categoryColor)}>
          {definition.name}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {visibleParams.map((paramDef) => {
          const value = parameterValues.get(paramDef.id) ?? paramDef.defaultValue;
          return (
            <Knob
              key={paramDef.id}
              value={value}
              min={paramDef.min}
              max={paramDef.max}
              step={paramDef.step}
              onChange={(v) => onParameterChange(paramDef.id, v)}
              label={paramDef.name}
              size="sm"
              unit={paramDef.unit}
            />
          );
        })}
      </div>

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onToggleBypass(); }}
        aria-label={`${effect.isBypassed ? 'Enable' : 'Bypass'} ${definition.name}`}
        className={mergeClassNames(
          'flex items-center justify-center',
          'h-8 w-8 rounded-full',
          'border-2 border-border-strong',
          'transition-all duration-150 ease-out',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary',
          effect.isBypassed
            ? 'bg-bg-elevated text-text-muted'
            : 'bg-accent-primary text-text-inverse',
        )}
      >
        <Power className="h-4 w-4" />
      </button>
    </div>
  );
}
