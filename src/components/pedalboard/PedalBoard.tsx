'use client';

import { Plus, ArrowRight } from 'lucide-react';
import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import { EffectPedal } from '@/components/pedalboard/EffectPedal';
import { usePedalboardStore } from '@/lib/store/pedalboardStore';
import { useCallback, useRef } from 'react';

interface Props {
  onOpenEffectRack: () => void;
}

export function PedalBoard({ onOpenEffectRack }: Props) {
  const {
    effects,
    selectedEffectId,
    selectEffect,
    toggleBypass,
    removeEffect,
    setEffectParameter,
    moveEffect,
  } = usePedalboardStore();

  const dragIndexRef = useRef<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    dragIndexRef.current = index;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndexRef.current === null || dragIndexRef.current === index) return;
    moveEffect(dragIndexRef.current, index);
    dragIndexRef.current = index;
  }, [moveEffect]);

  const handleDragEnd = useCallback(() => {
    dragIndexRef.current = null;
  }, []);

  const hasEffects = effects.length > 0;

  const signalFlowLabel = (
    <div className="flex items-center gap-1 text-text-muted">
      <ArrowRight className="h-4 w-4" />
    </div>
  );

  const addButton = (
    <button
      type="button"
      onClick={onOpenEffectRack}
      aria-label="Add effect to chain"
      className={mergeClassNames(
        'flex flex-col items-center justify-center gap-2',
        'h-40 w-44 rounded-xl',
        'border-2 border-dashed border-border-default',
        'text-text-muted',
        'transition-all duration-150 ease-out',
        'hover:border-accent-primary hover:text-accent-primary',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary',
      )}
    >
      <Plus className="h-6 w-6" />
      <span className="text-xs font-medium">Add Effect</span>
    </button>
  );

  const emptyState = (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <p className="text-sm text-text-muted">No effects in the chain.</p>
      <p className="text-xs text-text-muted">Click &quot;Add Effect&quot; to get started.</p>
    </div>
  );

  const effectChain = hasEffects ? (
    effects.map((effect, index) => (
      <div key={effect.id} className="flex items-center gap-3">
        {index > 0 && signalFlowLabel}
        <div
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragEnd={handleDragEnd}
        >
          <EffectPedal
            effect={effect}
            isSelected={selectedEffectId === effect.id}
            onSelect={() => selectEffect(effect.id)}
            onToggleBypass={() => toggleBypass(effect.id)}
            onRemove={() => removeEffect(effect.id)}
            onParameterChange={(paramId, value) =>
              setEffectParameter(effect.id, paramId, value)
            }
          />
        </div>
      </div>
    ))
  ) : null;

  return (
    <div
      className={mergeClassNames(
        'flex items-start gap-3 overflow-x-auto p-4',
        'scrollbar-thin',
      )}
    >
      <div className="flex items-center gap-1 self-center text-text-muted">
        <span className="text-xs font-mono">AMP</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </div>

      {effectChain}
      {!hasEffects && emptyState}

      {hasEffects && signalFlowLabel}
      {addButton}

      <div className="flex items-center gap-1 self-center text-text-muted">
        <ArrowRight className="h-3.5 w-3.5" />
        <span className="text-xs font-mono">OUT</span>
      </div>
    </div>
  );
}
