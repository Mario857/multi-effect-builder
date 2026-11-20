'use client';

import { useMemo } from 'react';
import { AMP_TYPES, EFFECT_DEFINITIONS } from '@/lib/constants/effects';
import { AMP_SHORT_LABELS } from '@/lib/constants/ui';
import { usePedalboardStore } from '@/lib/store/pedalboardStore';
import type { AmpType, EffectDefinition } from '@/types/audio';

/** One amp model as offered by the amp selector. */
export interface AmpOption {
  readonly type: AmpType;
  readonly label: string;
  readonly ariaLabel: string;
  readonly isActive: boolean;
  readonly handleSelect: () => void;
}

/** What the amp selector displays. */
export interface AmpSelectorState {
  /** Definition of the active amp model. */
  readonly ampDefinition: EffectDefinition<AmpType>;
  readonly ampOptions: readonly AmpOption[];
}

/**
 * State of the amp selector. Subscribes to the amp model only — the amp's knobs
 * subscribe to their own values (see `useAmpParameterControl`).
 * @returns The active amp's definition and the selectable amp models
 */
export function useAmpSelector(): AmpSelectorState {
  const ampType = usePedalboardStore((state) => state.ampType);
  const setAmpType = usePedalboardStore((state) => state.setAmpType);

  const ampOptions = useMemo(
    () =>
      AMP_TYPES.map((type) => ({
        type,
        label: AMP_SHORT_LABELS[type],
        ariaLabel: `Select ${EFFECT_DEFINITIONS[type].name}`,
        isActive: type === ampType,
        handleSelect: () => {
          setAmpType(type);
        },
      })),
    [ampType, setAmpType],
  );

  return { ampDefinition: EFFECT_DEFINITIONS[ampType], ampOptions };
}
