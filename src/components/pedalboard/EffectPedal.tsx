'use client';

import { ChevronLeft, ChevronRight, Power, SlidersHorizontal, X } from 'lucide-react';
import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import { EffectParameterKnob } from '@/components/pedalboard/EffectParameterKnob';
import { IconButton } from '@/components/shared/IconButton';
import {
  ACCENT_BORDER_CLASSES,
  ACCENT_TEXT_CLASSES,
  SECTION_TITLE_CLASSES,
} from '@/lib/constants/ui';
import { useEffectPedal } from '@/hooks/useEffectPedal';
import { usePedalDrag } from '@/hooks/usePedalDrag';

interface Props {
  /** Id of the effect instance the pedal shows. */
  effectId: string;
  /** Position of the pedal in the chain. */
  index: number;
  isLast: boolean;
}

/**
 * One pedal of the signal chain: its first few knobs, a foot-switch that bypasses it and
 * buttons to edit, remove and reorder it.
 *
 * The pedal is a labelled group, not a button: it contains buttons and knobs, which must
 * not be nested inside another interactive control. Selecting it is done with the "edit
 * parameters" button; clicking anywhere on its body is a pointer shortcut for the same.
 * It can be reordered by dragging its body or, from the keyboard, with the move buttons.
 */
export function EffectPedal({ effectId, index, isLast }: Props) {
  const {
    definition,
    visibleParameters,
    isBypassed,
    isSelected,
    canMoveEarlier,
    canMoveLater,
    moveEarlierButtonRef,
    moveLaterButtonRef,
    handleSelect,
    handleToggleSelect,
    handleToggleBypass,
    handleRemove,
    handleMoveEarlier,
    handleMoveLater,
  } = useEffectPedal({ effectId, index, isLast });
  const { handleDragStart, handleDragOver, handleDrop, handleDragEnd } = usePedalDrag(effectId);

  // The effect was removed a moment ago and this pedal is about to unmount (see useEffectPedal)
  if (!definition) return null;

  const { name, category } = definition;

  const ledIndicator = isBypassed ? (
    <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-text-muted/10 bg-text-muted/20" />
  ) : (
    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-status-success led-active" />
  );

  const selectionClasses = isSelected
    ? mergeClassNames(ACCENT_BORDER_CLASSES[category], 'shadow-(--shadow-pedal)')
    : 'border-glass-border card-highlight';

  const knobs = visibleParameters.map((parameter) => (
    <EffectParameterKnob key={parameter.id} effectId={effectId} parameter={parameter} size="sm" />
  ));

  return (
    <div
      role="group"
      aria-label={`${name} pedal`}
      draggable
      onClick={handleSelect}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={handleDragEnd}
      className={mergeClassNames(
        'relative flex shrink-0 flex-col items-center gap-3',
        'w-52 rounded-xl border p-3',
        'bg-linear-to-b from-bg-elevated/80 to-bg-surface/80 backdrop-blur-sm',
        'cursor-pointer select-none',
        'transition-all duration-200 ease-out hover:scale-102',
        selectionClasses,
        isBypassed && 'opacity-50 grayscale-30',
      )}
    >
      <div className="absolute left-1.5 top-1.5">
        <IconButton
          aria-label={`Edit ${name} parameters`}
          size="sm"
          isActive={isSelected}
          onClick={handleToggleSelect}
        >
          <SlidersHorizontal />
        </IconButton>
      </div>

      <div className="absolute right-1.5 top-1.5">
        <IconButton aria-label={`Remove ${name}`} size="sm" onClick={handleRemove}>
          <X />
        </IconButton>
      </div>

      <div className="flex max-w-full items-center gap-2 px-6">
        {ledIndicator}
        <h3
          className={mergeClassNames('truncate', SECTION_TITLE_CLASSES, ACCENT_TEXT_CLASSES[category])}
        >
          {name}
        </h3>
      </div>

      <div className="flex items-center gap-2">{knobs}</div>

      <div className="flex items-center gap-3">
        <IconButton
          ref={moveEarlierButtonRef}
          aria-label={`Move ${name} earlier in the chain`}
          size="sm"
          disabled={!canMoveEarlier}
          onClick={handleMoveEarlier}
        >
          <ChevronLeft />
        </IconButton>
        <IconButton
          aria-label={`${name} on`}
          variant="solid"
          shape="round"
          isActive={!isBypassed}
          onClick={handleToggleBypass}
        >
          <Power />
        </IconButton>
        <IconButton
          ref={moveLaterButtonRef}
          aria-label={`Move ${name} later in the chain`}
          size="sm"
          disabled={!canMoveLater}
          onClick={handleMoveLater}
        >
          <ChevronRight />
        </IconButton>
      </div>
    </div>
  );
}
