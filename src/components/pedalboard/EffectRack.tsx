'use client';

import { X, Plus } from 'lucide-react';
import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import { IconButton } from '@/components/shared/IconButton';
import { PEDAL_EFFECT_TYPES, EFFECT_DEFINITIONS } from '@/lib/constants/effects';
import { CATEGORY_COLORS, CATEGORY_BG_COLORS, CATEGORY_LABELS } from '@/lib/constants/ui';
import { usePedalboardStore } from '@/lib/store/pedalboardStore';
import { EFFECT_CATEGORY } from '@/types/audio';
import type { PedalEffectType, EffectCategory } from '@/types/audio';
import { useState, useMemo } from 'react';

const FILTER_CATEGORIES: readonly EffectCategory[] = [
  EFFECT_CATEGORY.DISTORTION,
  EFFECT_CATEGORY.DELAY,
  EFFECT_CATEGORY.REVERB,
  EFFECT_CATEGORY.MODULATION,
  EFFECT_CATEGORY.DYNAMICS,
  EFFECT_CATEGORY.EQ,
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function EffectRack({ isOpen, onClose }: Props) {
  const { addEffect } = usePedalboardStore();
  const [activeFilter, setActiveFilter] = useState<EffectCategory | null>(null);

  const filteredEffects = useMemo(() => {
    const allEffects = PEDAL_EFFECT_TYPES.map((type) => EFFECT_DEFINITIONS[type]);
    if (!activeFilter) return allEffects;
    return allEffects.filter((def) => def.category === activeFilter);
  }, [activeFilter]);

  if (!isOpen) return null;

  const handleAdd = (type: PedalEffectType) => {
    addEffect(type);
    onClose();
  };

  return (
    <div
      className={mergeClassNames(
        'fixed inset-y-0 right-0 z-50 w-80',
        'flex flex-col',
        'border-l border-glass-border bg-bg-secondary/90 backdrop-blur-xl',
        'shadow-2xl',
      )}
    >
      <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
        <span className="text-sm font-bold">Effect Rack</span>
        <IconButton aria-label="Close effect rack" onClick={onClose}>
          <X className="h-4 w-4" />
        </IconButton>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border-subtle px-4 py-2">
        <button
          type="button"
          onClick={() => setActiveFilter(null)}
          className={mergeClassNames(
            'rounded-full px-2.5 py-1 text-xs font-medium',
            'transition-all duration-150 ease-out',
            !activeFilter
              ? 'bg-accent-primary text-text-inverse'
              : 'bg-bg-elevated text-text-secondary hover:text-text-primary',
          )}
        >
          All
        </button>
        {FILTER_CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveFilter(category)}
            className={mergeClassNames(
              'rounded-full px-2.5 py-1 text-xs font-medium',
              'transition-all duration-150 ease-out',
              activeFilter === category
                ? `${CATEGORY_BG_COLORS[category]} ${CATEGORY_COLORS[category]}`
                : 'bg-bg-elevated text-text-secondary hover:text-text-primary',
            )}
          >
            {CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        <div className="flex flex-col gap-2">
          {filteredEffects.map((def) => (
            <button
              key={def.type}
              type="button"
              onClick={() => handleAdd(def.type)}
              aria-label={`Add ${def.name} to chain`}
              className={mergeClassNames(
                'flex items-center gap-3 rounded-lg p-3',
                'border border-border-default',
                'transition-all duration-150 ease-out',
                'hover:border-accent-primary hover:bg-bg-hover',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary',
                'text-left',
              )}
            >
              <div
                className={mergeClassNames(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  CATEGORY_BG_COLORS[def.category],
                )}
              >
                <Plus className={mergeClassNames('h-4 w-4 shrink-0', CATEGORY_COLORS[def.category])} />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-text-primary">{def.name}</span>
                <span className="text-xs text-text-muted">{def.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
