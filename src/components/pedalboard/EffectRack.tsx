'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Plus, X } from 'lucide-react';
import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import { ChipButton } from '@/components/shared/ChipButton';
import { IconButton } from '@/components/shared/IconButton';
import {
  ACCENT_SOFT_CLASSES,
  FOCUS_RING_CLASSES,
  INTERACTIVE_TRANSITION_CLASSES,
} from '@/lib/constants/ui';
import { useEffectRack } from '@/hooks/useEffectRack';

/**
 * Side panel listing the effects that can be added to the chain, filterable by category.
 * It is a modal dialog (Radix Dialog): focus is trapped inside while it is open, Escape
 * or a click outside closes it, and focus then returns to the control that opened it.
 * @param isOpen - Whether the rack is shown
 * @param onClose - Called when the rack should close
 */
export function EffectRack({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const {
    isShowingAll,
    handleShowAll,
    categoryFilters,
    effectOptions,
    handleOpenChange,
    handleOpenAutoFocus,
    handleCloseAutoFocus,
  } = useEffectRack(onClose);

  const categoryChips = categoryFilters.map((filter) => (
    <ChipButton
      key={filter.category}
      shape="pill"
      variant="soft"
      accent={filter.category}
      isActive={filter.isActive}
      onClick={filter.handleSelect}
      aria-label={filter.ariaLabel}
    >
      {filter.label}
    </ChipButton>
  ));

  const effectButtons = effectOptions.map((option) => (
    <button
      key={option.type}
      type="button"
      onClick={option.handleAdd}
      aria-label={option.ariaLabel}
      className={mergeClassNames(
        'flex shrink-0 items-center gap-3 rounded-lg p-3',
        'border border-border-default text-left',
        'hover:border-accent-primary hover:bg-bg-hover',
        INTERACTIVE_TRANSITION_CLASSES,
        FOCUS_RING_CLASSES,
      )}
    >
      <span
        className={mergeClassNames(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
          ACCENT_SOFT_CLASSES[option.category],
        )}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="flex flex-col">
        <span className="text-sm font-medium text-text-primary">{option.name}</span>
        <span className="text-xs text-text-muted">{option.description}</span>
      </span>
    </button>
  ));

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-bg-primary/60" />
        <Dialog.Content
          onOpenAutoFocus={handleOpenAutoFocus}
          onCloseAutoFocus={handleCloseAutoFocus}
          className={mergeClassNames(
            'fixed inset-y-0 right-0 z-50 w-80',
            'flex flex-col',
            'border-l border-glass-border bg-bg-secondary/90 backdrop-blur-xl',
            'shadow-2xl',
          )}
        >
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
            <Dialog.Title className="text-sm font-bold">Effect Rack</Dialog.Title>
            <IconButton aria-label="Close effect rack" onClick={onClose}>
              <X />
            </IconButton>
          </div>
          <Dialog.Description className="sr-only">
            Choose an effect to add to the end of the signal chain.
          </Dialog.Description>

          <div
            role="group"
            aria-label="Filter effects by category"
            className="flex flex-wrap gap-1 border-b border-border-subtle px-4 py-2"
          >
            <ChipButton
              shape="pill"
              isActive={isShowingAll}
              onClick={handleShowAll}
              aria-label="Show all effects"
            >
              All
            </ChipButton>
            {categoryChips}
          </div>

          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-3 scrollbar-thin">
            {effectButtons}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
