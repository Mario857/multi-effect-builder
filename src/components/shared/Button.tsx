'use client';

import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import {
  DISABLED_CLASSES,
  FOCUS_RING_CLASSES,
  INTERACTIVE_TRANSITION_CLASSES,
} from '@/lib/constants/ui';

const VARIANT_CLASSES = {
  primary: 'bg-accent-primary text-text-inverse hover:bg-accent-primary-hover',
  secondary: 'bg-bg-elevated text-text-primary border border-border-default hover:bg-bg-hover',
  ghost: 'text-text-secondary hover:bg-bg-hover hover:text-text-primary',
  danger: 'bg-status-danger text-white hover:bg-status-danger/80',
  // Glowing amber gradient for the single most important call to action (e.g. "Start Audio").
  accent: mergeClassNames(
    'bg-linear-to-r from-accent-primary to-accent-primary-hover text-text-inverse',
    'hover:brightness-110 hover:shadow-(--shadow-glow-amber)',
  ),
  // Dashed outline placeholder that invites adding something (e.g. the "Add Effect" slot).
  dashed: mergeClassNames(
    'border-2 border-dashed border-border-default text-text-muted',
    'hover:border-accent-primary hover:text-accent-primary',
  ),
} as const;

const SIZE_CLASSES = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3.5 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
  // Pedal-sized slot: icon stacked above the label.
  tile: 'h-40 w-52 shrink-0 flex-col rounded-xl text-xs',
} as const;

type Variant = keyof typeof VARIANT_CLASSES;
type Size = keyof typeof SIZE_CLASSES;

interface Props {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
  className?: string;
  ref?: React.Ref<HTMLButtonElement>;
}

/**
 * Standard text button.
 *
 * Variants: `primary`, `secondary`, `ghost`, `danger`, `accent` (amber gradient call to
 * action) and `dashed` (placeholder slot). Sizes: `sm`, `md`, `lg` and `tile` (a pedal-sized
 * slot with its content stacked vertically — meant for `variant="dashed"`).
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  type = 'button',
  'aria-label': ariaLabel,
  className,
  ref,
}: Props) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={mergeClassNames(
        'inline-flex items-center justify-center gap-2',
        'rounded-lg font-medium',
        INTERACTIVE_TRANSITION_CLASSES,
        FOCUS_RING_CLASSES,
        DISABLED_CLASSES,
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
    >
      {children}
    </button>
  );
}
