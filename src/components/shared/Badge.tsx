'use client';

import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import { ACCENT_SOFT_CLASSES } from '@/lib/constants/ui';

const VARIANT_CLASSES = {
  default: 'bg-bg-elevated text-text-secondary',
  success: 'bg-status-success/15 text-status-success',
  warning: 'bg-status-warning/15 text-status-warning',
  danger: 'bg-status-danger/15 text-status-danger',
  info: 'bg-status-info/15 text-status-info',
  // `primary` plus one variant per effect category (`distortion`, `delay`, ...).
  ...ACCENT_SOFT_CLASSES,
} as const;

const APPEARANCE_CLASSES = {
  pill: 'rounded-full font-medium',
  // Squarer, bold uppercase label — e.g. the effect name in the parameter panel.
  tag: 'rounded-md font-bold uppercase',
} as const;

type Variant = keyof typeof VARIANT_CLASSES;
type Appearance = keyof typeof APPEARANCE_CLASSES;

interface Props {
  children: React.ReactNode;
  variant?: Variant;
  appearance?: Appearance;
  className?: string;
}

/**
 * Inline status / label badge.
 *
 * Variants: `default`, `success`, `warning`, `danger`, `info`, `primary` and every effect
 * category (so `variant={definition.category}` gives a category-coloured label).
 * Appearances: `pill` (default) and `tag`.
 */
export function Badge({ children, variant = 'default', appearance = 'pill', className }: Props) {
  return (
    <span
      className={mergeClassNames(
        'inline-flex items-center',
        'px-2 py-0.5 text-xs',
        APPEARANCE_CLASSES[appearance],
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
