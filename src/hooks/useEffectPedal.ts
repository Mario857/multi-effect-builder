'use client';

import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { EFFECT_DEFINITIONS } from '@/lib/constants/effects';
import { PEDAL_VISIBLE_PARAMETER_COUNT } from '@/lib/constants/ui';
import { usePedalboardStore } from '@/lib/store/pedalboardStore';
import type { EffectDefinition, EffectParameterDefinition } from '@/types/audio';

// Offsets applied to a pedal's position in the chain by its two move buttons
const MOVE_OFFSET = {
  EARLIER: -1,
  LATER: 1,
} as const;

type MoveOffset = (typeof MOVE_OFFSET)[keyof typeof MOVE_OFFSET];

const NO_PARAMETERS: readonly EffectParameterDefinition[] = [];

interface Options {
  effectId: string;
  /** Position of the pedal in the chain. */
  index: number;
  isLast: boolean;
}

/** State and handlers of one pedal on the board. */
export interface EffectPedalState {
  /**
   * Definition of the pedal's effect. Null for the instant between the effect being removed
   * from the store and React unmounting the pedal — render nothing then.
   */
  readonly definition: EffectDefinition | null;
  /** The parameters that get a knob on the pedal itself. */
  readonly visibleParameters: readonly EffectParameterDefinition[];
  readonly isBypassed: boolean;
  readonly isSelected: boolean;
  readonly canMoveEarlier: boolean;
  readonly canMoveLater: boolean;
  readonly moveEarlierButtonRef: React.RefObject<HTMLButtonElement | null>;
  readonly moveLaterButtonRef: React.RefObject<HTMLButtonElement | null>;
  /** Selects the pedal (click anywhere on its body). */
  readonly handleSelect: () => void;
  /** Selects the pedal, or clears the selection when it is already selected. */
  readonly handleToggleSelect: (event: React.MouseEvent) => void;
  readonly handleToggleBypass: (event: React.MouseEvent) => void;
  readonly handleRemove: (event: React.MouseEvent) => void;
  readonly handleMoveEarlier: (event: React.MouseEvent) => void;
  readonly handleMoveLater: (event: React.MouseEvent) => void;
}

/**
 * Connects one pedal to the pedalboard store. The pedal subscribes to its own effect's
 * type, bypass state and selection only: parameter changes re-render the knobs
 * (see `useEffectParameterControl`), not the pedal.
 *
 * The button handlers stop the click from bubbling, because a click on the pedal's body
 * selects it and pressing one of its buttons must not do that as well.
 * @returns State and handlers for the pedal
 */
export function useEffectPedal({ effectId, index, isLast }: Options): EffectPedalState {
  const { type, isBypassed, isSelected, selectEffect, toggleBypass, removeEffect, moveEffect } =
    usePedalboardStore(
      useShallow((state) => {
        const effect = state.effects.find((candidate) => candidate.id === effectId);
        return {
          type: effect?.type,
          isBypassed: effect?.isBypassed === true,
          isSelected: state.selectedEffectId === effectId,
          selectEffect: state.selectEffect,
          toggleBypass: state.toggleBypass,
          removeEffect: state.removeEffect,
          moveEffect: state.moveEffect,
        };
      }),
    );

  const moveEarlierButtonRef = useRef<HTMLButtonElement>(null);
  const moveLaterButtonRef = useRef<HTMLButtonElement>(null);
  // Set by this pedal's own move buttons until the focus has been put back after the move
  const pendingMoveRef = useRef<MoveOffset | null>(null);

  // Moving a pedal later makes React re-insert its DOM node, which drops the keyboard focus,
  // and reaching either end of the chain disables the button that was just pressed. Put the
  // focus back on that button — or on the opposite one at the end of the chain — so the
  // pedal can be moved several steps without tabbing back to it.
  useEffect(() => {
    const pendingMove = pendingMoveRef.current;
    if (pendingMove === null) return;
    pendingMoveRef.current = null;

    const earlierButton = moveEarlierButtonRef.current;
    const laterButton = moveLaterButtonRef.current;
    const [pressedButton, oppositeButton] =
      pendingMove === MOVE_OFFSET.EARLIER ? [earlierButton, laterButton] : [laterButton, earlierButton];
    const focusTarget = pressedButton?.disabled ? oppositeButton : pressedButton;
    focusTarget?.focus();
  }, [index]);

  const definition = type === undefined ? null : EFFECT_DEFINITIONS[type];
  const visibleParameters = definition
    ? definition.parameters.slice(0, PEDAL_VISIBLE_PARAMETER_COUNT)
    : NO_PARAMETERS;

  const handleSelect = () => {
    selectEffect(effectId);
  };

  const handleToggleSelect = (event: React.MouseEvent) => {
    event.stopPropagation();
    selectEffect(isSelected ? null : effectId);
  };

  const handleToggleBypass = (event: React.MouseEvent) => {
    event.stopPropagation();
    toggleBypass(effectId);
  };

  const handleRemove = (event: React.MouseEvent) => {
    event.stopPropagation();
    removeEffect(effectId);
  };

  const handleMove = (event: React.MouseEvent, offset: MoveOffset) => {
    event.stopPropagation();
    pendingMoveRef.current = offset;
    moveEffect(index, index + offset);
  };

  const handleMoveEarlier = (event: React.MouseEvent) => {
    handleMove(event, MOVE_OFFSET.EARLIER);
  };

  const handleMoveLater = (event: React.MouseEvent) => {
    handleMove(event, MOVE_OFFSET.LATER);
  };

  return {
    definition,
    visibleParameters,
    isBypassed,
    isSelected,
    canMoveEarlier: index > 0,
    canMoveLater: !isLast,
    moveEarlierButtonRef,
    moveLaterButtonRef,
    handleSelect,
    handleToggleSelect,
    handleToggleBypass,
    handleRemove,
    handleMoveEarlier,
    handleMoveLater,
  };
}
