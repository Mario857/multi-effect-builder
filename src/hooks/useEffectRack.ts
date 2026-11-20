'use client';

import { useMemo, useRef, useState } from 'react';
import { EFFECT_DEFINITIONS, PEDAL_EFFECT_TYPES } from '@/lib/constants/effects';
import { CATEGORY_LABELS, EFFECT_RACK_FILTER_CATEGORIES } from '@/lib/constants/ui';
import { usePedalboardStore } from '@/lib/store/pedalboardStore';
import type { EffectCategory, PedalEffectType } from '@/types/audio';

/** One category chip of the effect rack's filter. */
export interface EffectRackCategoryFilter {
  readonly category: EffectCategory;
  readonly label: string;
  readonly ariaLabel: string;
  readonly isActive: boolean;
  readonly handleSelect: () => void;
}

/** One effect that can be added from the rack. */
export interface EffectRackOption {
  readonly type: PedalEffectType;
  readonly name: string;
  readonly description: string;
  readonly category: EffectCategory;
  readonly ariaLabel: string;
  /** Adds the effect to the end of the chain and closes the rack. */
  readonly handleAdd: () => void;
}

/** State and handlers of the effect rack dialog. */
export interface EffectRackState {
  /** True while no category filter is set. */
  readonly isShowingAll: boolean;
  readonly handleShowAll: () => void;
  readonly categoryFilters: readonly EffectRackCategoryFilter[];
  /** The effects that pass the active filter. */
  readonly effectOptions: readonly EffectRackOption[];
  readonly handleOpenChange: (isOpen: boolean) => void;
  readonly handleOpenAutoFocus: () => void;
  readonly handleCloseAutoFocus: (event: Event) => void;
}

/**
 * State of the effect rack: the category filter, the effects it lets through and the
 * dialog's focus handling.
 * @param onClose - Called when the rack should close (Escape, click outside, effect added)
 * @returns Filter chips, the filtered effects and the dialog's event handlers
 */
export function useEffectRack(onClose: () => void): EffectRackState {
  const addEffect = usePedalboardStore((state) => state.addEffect);
  const [activeCategory, setActiveCategory] = useState<EffectCategory | null>(null);

  // The element that had the focus when the rack opened (the "Add Effect" button)
  const openerRef = useRef<HTMLElement | null>(null);

  const categoryFilters = useMemo(
    () =>
      EFFECT_RACK_FILTER_CATEGORIES.map((category) => ({
        category,
        label: CATEGORY_LABELS[category],
        ariaLabel: `Show ${CATEGORY_LABELS[category]} effects only`,
        isActive: category === activeCategory,
        handleSelect: () => {
          setActiveCategory(category);
        },
      })),
    [activeCategory],
  );

  const effectOptions = useMemo(
    () =>
      PEDAL_EFFECT_TYPES.map((type) => EFFECT_DEFINITIONS[type])
        .filter((definition) => activeCategory === null || definition.category === activeCategory)
        .map((definition) => ({
          type: definition.type,
          name: definition.name,
          description: definition.description,
          category: definition.category,
          ariaLabel: `Add ${definition.name} to chain`,
          handleAdd: () => {
            addEffect(definition.type);
            onClose();
          },
        })),
    [activeCategory, addEffect, onClose],
  );

  const handleShowAll = () => {
    setActiveCategory(null);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) onClose();
  };

  // Radix calls this just before it moves the focus into the dialog
  const handleOpenAutoFocus = () => {
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  };

  // Radix returns the focus to a `Dialog.Trigger` on close, but this dialog is opened from
  // elsewhere on the page and has none, so the focus is sent back to its opener here.
  const handleCloseAutoFocus = (event: Event) => {
    event.preventDefault();
    openerRef.current?.focus();
  };

  return {
    isShowingAll: activeCategory === null,
    handleShowAll,
    categoryFilters,
    effectOptions,
    handleOpenChange,
    handleOpenAutoFocus,
    handleCloseAutoFocus,
  };
}
