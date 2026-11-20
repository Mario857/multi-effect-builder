'use client';

import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import {
  ACCENT_SOFT_CLASSES,
  ACCENT_SOLID_CLASSES,
  DISABLED_CLASSES,
  FOCUS_RING_CLASSES,
  INTERACTIVE_TRANSITION_CLASSES,
} from '@/lib/constants/ui';
import type { AccentColor } from '@/lib/constants/ui';

const SIZE_CLASSES = {
  sm: 'px-2 py-1',
  md: 'px-2.5 py-1',
} as const;

const SHAPE_CLASSES = {
  rounded: 'rounded-md',
  pill: 'rounded-full',
} as const;

// How an active chip shows its accent: filled, or a faint tint with accent-coloured text.
const ACTIVE_CLASSES = {
  solid: ACCENT_SOLID_CLASSES,
  soft: ACCENT_SOFT_CLASSES,
} as const;

const IDLE_CLASSES = 'bg-bg-elevated text-text-secondary hover:text-text-primary';

type Size = keyof typeof SIZE_CLASSES;
type Shape = keyof typeof SHAPE_CLASSES;
type Variant = keyof typeof ACTIVE_CLASSES;

interface Props {
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Colour of the active state: the app accent (`primary`) or an effect category. */
  accent?: AccentColor;
  variant?: Variant;
  size?: Size;
  shape?: Shape;
  /** Optional leading icon; sized by the chip. */
  icon?: React.ReactNode;
  disabled?: boolean;
  'aria-label'?: string;
  ref?: React.Ref<HTMLButtonElement>;
}

/**
 * Small toggle / selector chip for radio-group style selectors and filters
 * (amp model, effect category, preset). The selected chip is exposed through `aria-pressed`.
 *
 * `accent` picks the colour of the active chip and `variant` how it is applied
 * (`solid` fill or `soft` tint), so callers never pass colour classes.
 */
export function ChipButton({
  children,
  isActive = false,
  onClick,
  accent = 'primary',
  variant = 'solid',
  size = 'md',
  shape = 'rounded',
  icon,
  disabled = false,
  'aria-label': ariaLabel,
  ref,
}: Props) {
  const stateClasses = isActive ? ACTIVE_CLASSES[variant][accent] : IDLE_CLASSES;

  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={isActive}
      className={mergeClassNames(
        'inline-flex items-center gap-1.5',
        'text-xs font-medium [&_svg]:size-3',
        SIZE_CLASSES[size],
        SHAPE_CLASSES[shape],
        INTERACTIVE_TRANSITION_CLASSES,
        FOCUS_RING_CLASSES,
        DISABLED_CLASSES,
        stateClasses,
      )}
    >
      {icon}
      {children}
    </button>
  );
}
