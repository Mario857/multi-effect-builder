'use client';

import { mergeClassNames } from '@/lib/helpers/mergeClassNames';

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

type Size = keyof typeof SIZE_CLASSES;

interface Props {
  children: React.ReactNode;
  size?: Size;
  disabled?: boolean;
  onClick?: () => void;
  'aria-label': string;
  className?: string;
}

export function IconButton({
  children,
  size = 'md',
  disabled = false,
  onClick,
  'aria-label': ariaLabel,
  className,
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={ariaLabel}
      className={mergeClassNames(
        'inline-flex items-center justify-center',
        'rounded-lg',
        'text-text-secondary hover:text-text-primary hover:bg-bg-hover',
        'transition-all duration-150 ease-out',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary',
        'disabled:opacity-50 disabled:pointer-events-none',
        SIZE_CLASSES[size],
        ICON_SIZE_CLASSES[size],
        className,
      )}
    >
      {children}
    </button>
  );
}
