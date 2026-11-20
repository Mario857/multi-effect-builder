'use client';

import { PEDAL_DRAG_MIME_TYPE } from '@/lib/constants/ui';
import { usePedalboardStore } from '@/lib/store/pedalboardStore';

// The DataTransfer operation a pedal drag stands for: the pedal changes place, it is not copied
const DRAG_OPERATION = 'move';

// Id of the pedal being dragged. Only one drag can be in progress at a time, so this is
// module state shared by every pedal; it cannot travel on the DataTransfer instead, because
// browsers keep the transferred data unreadable until the drop.
let draggedEffectId: string | null = null;

/** Drag-and-drop handlers for a pedal's root element, which must also be `draggable`. */
export interface PedalDragHandlers {
  readonly handleDragStart: (event: React.DragEvent) => void;
  readonly handleDragOver: (event: React.DragEvent) => void;
  readonly handleDrop: (event: React.DragEvent) => void;
  readonly handleDragEnd: () => void;
}

/**
 * Makes a pedal reorderable by HTML5 drag-and-drop: while a pedal is dragged over another
 * one, it takes that pedal's place in the chain, so the board shows the new order live.
 * Positions are looked up by id when the events fire, so they cannot go stale mid-drag.
 * @param effectId - Id of the effect instance the pedal shows
 * @returns Handlers to spread on the pedal's root element
 */
export function usePedalDrag(effectId: string): PedalDragHandlers {
  const moveEffect = usePedalboardStore((state) => state.moveEffect);

  const handleDragStart = (event: React.DragEvent) => {
    draggedEffectId = effectId;
    // Firefox only starts a drag once data has been set on the transfer
    event.dataTransfer.setData(PEDAL_DRAG_MIME_TYPE, effectId);
    event.dataTransfer.effectAllowed = DRAG_OPERATION;
  };

  const handleDragOver = (event: React.DragEvent) => {
    // Something other than a pedal is being dragged across the board (a file, selected text)
    const isPedalDrag = event.dataTransfer.types.includes(PEDAL_DRAG_MIME_TYPE);
    if (draggedEffectId === null || !isPedalDrag) return;

    // Cancelling dragover is what marks this pedal as a valid drop target
    event.preventDefault();
    event.dataTransfer.dropEffect = DRAG_OPERATION;
    if (draggedEffectId === effectId) return;

    const { effects } = usePedalboardStore.getState();
    moveEffect(
      effects.findIndex((effect) => effect.id === draggedEffectId),
      effects.findIndex((effect) => effect.id === effectId),
    );
  };

  // The reorder already happened during dragover; this only keeps the browser from
  // handling the drop itself
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    // `dragend` is not guaranteed after the dragged pedal's DOM node was re-inserted by a
    // reorder, so the drag is also ended here
    draggedEffectId = null;
  };

  const handleDragEnd = () => {
    draggedEffectId = null;
  };

  return { handleDragStart, handleDragOver, handleDrop, handleDragEnd };
}
