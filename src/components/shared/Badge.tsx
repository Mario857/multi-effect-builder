'use client';

import { mergeClassNames } from '@/lib/helpers/mergeClassNames';

const VARIANT_CLASSES = {
  default: 'bg-bg-elevated text-text-secondary',
  success: 'bg-status-success/15 text-status-success',
  warning: 'bg-status-warning/15 text-status-warning',
  danger: 'bg-status-danger/15 text-status-danger',
  info: 'bg-status-info/15 text-status-info',
} as const;

type Variant = keyof typeof VARIANT_CLASSES;

interface Props {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}

export function Badge({ children, variant = 'default', className }: Props) {
  return (
    <span
      className={mergeClassNames(
        'inline-flex items-center',
        'rounded-full px-2 py-0.5',
        'text-xs font-medium',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
