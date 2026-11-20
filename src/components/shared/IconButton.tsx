'use client';

import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import {
  DISABLED_CLASSES,
  FOCUS_RING_CLASSES,
  INTERACTIVE_TRANSITION_CLASSES,
} from '@/lib/constants/ui';

const SIZE_CLASSES = {
  sm: 'h-7 w-7',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
} as const;

const ICON_SIZE_CLASSES = {
  sm: '[&_svg]:h-3.5 [&_svg]:w-3.5',
  md: '[&_svg]:h-4 [&_svg]:w-4',
  lg: '[&_svg]:h-5 [&_svg]:w-5',
} as const;

const SHAPE_CLASSES = {
  square: 'rounded-lg',
  round: 'rounded-full',
} as const;

const VARIANT_CLASSES = {
  // Bare icon that only gains a background on hover (toolbar buttons, close / remove).
  ghost: {
    idle: 'text-text-secondary hover:text-text-primary hover:bg-bg-hover',
    active: 'text-accent-primary hover:bg-bg-hover',
  },
  // Filled, bordered button that lights up amber while active (e.g. a pedal foot-switch).
  solid: {
    idle: 'border-2 border-border-strong bg-bg-elevated text-text-muted hover:text-text-primary',
    active: 'border-2 border-border-strong bg-accent-primary text-text-inverse hover:brightness-110',
  },
} as const;

type Size = keyof typeof SIZE_CLASSES;
type Shape = keyof typeof SHAPE_CLASSES;
type Variant = keyof typeof VARIANT_CLASSES;

interface Props {
  children: React.ReactNode;
  size?: Size;
  variant?: Variant;
  shape?: Shape;
  /**
   * Makes the button a toggle: it is announced as pressed / not pressed (`aria-pressed`)
   * and takes the active look of its variant while `true`. Omit for a plain action button.
   */
  isActive?: boolean;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  'aria-label': string;
  className?: string;
  ref?: React.Ref<HTMLButtonElement>;
}

/**
 * Icon-only button. Pass the icon as `children`; it is sized to match `size`.
 *
 * Variants: `ghost` (default) and `solid`. Shapes: `square` (default) and `round`.
 * Use `isActive` for toggles instead of overriding colours through `className`.
 */
export function IconButton({
  children,
  size = 'md',
  variant = 'ghost',
  shape = 'square',
  isActive,
  disabled = false,
  onClick,
  type = 'button',
  'aria-label': ariaLabel,
  className,
  ref,
}: Props) {
  const stateClasses = VARIANT_CLASSES[variant][isActive ? 'active' : 'idle'];

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={isActive}
      className={mergeClassNames(
        'inline-flex items-center justify-center',
        SHAPE_CLASSES[shape],
        stateClasses,
        INTERACTIVE_TRANSITION_CLASSES,
        FOCUS_RING_CLASSES,
        DISABLED_CLASSES,
        SIZE_CLASSES[size],
        ICON_SIZE_CLASSES[size],
        className,
      )}
    >
      {children}
    </button>
  );
}
