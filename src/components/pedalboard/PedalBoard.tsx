'use client';

import { Fragment } from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import { EffectPedal } from '@/components/pedalboard/EffectPedal';
import { Button } from '@/components/shared/Button';
import { usePedalboardStore } from '@/lib/store/pedalboardStore';

/**
 * The signal chain: the pedals in order, from the amp to the output, and the slot that
 * opens the effect rack.
 *
 * The board subscribes to the order of the pedals only; each pedal subscribes to its own
 * effect, so turning a knob or bypassing a pedal does not re-render the rest of the chain.
 * @param onOpenEffectRack - Opens the effect rack to add an effect
 */
export function PedalBoard({ onOpenEffectRack }: { onOpenEffectRack: () => void }) {
  const effectIds = usePedalboardStore(
    useShallow((state) => state.effects.map((effect) => effect.id)),
  );

  const lastIndex = effectIds.length - 1;
  const hasEffects = effectIds.length > 0;

  const signalFlowArrow = (
    <ArrowRight className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
  );

  // Every pedal is followed by an arrow: to the next pedal or, after the last, to the add slot
  const effectChain = effectIds.map((effectId, index) => (
    <Fragment key={effectId}>
      <EffectPedal effectId={effectId} index={index} isLast={index === lastIndex} />
      {signalFlowArrow}
    </Fragment>
  ));

  const emptyState = hasEffects ? null : (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 py-8 text-center">
      <p className="text-sm text-text-muted">No effects in the chain.</p>
      <p className="text-xs text-text-muted">Click &quot;Add Effect&quot; to get started.</p>
    </div>
  );

  return (
    <div
      className={mergeClassNames(
        'flex min-h-48 items-center gap-3 overflow-x-auto p-4',
        'scrollbar-thin',
      )}
    >
      <div className="flex shrink-0 items-center gap-1 text-text-muted">
        <span className="font-mono text-xs">AMP</span>
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </div>

      {effectChain}
      {emptyState}

      <Button variant="dashed" size="tile" onClick={onOpenEffectRack} aria-label="Add effect to chain">
        <Plus className="h-6 w-6" />
        Add Effect
      </Button>

      <div className="flex shrink-0 items-center gap-1 text-text-muted">
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="font-mono text-xs">OUT</span>
      </div>
    </div>
  );
}
