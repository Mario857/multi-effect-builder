'use client';

import * as Switch from '@radix-ui/react-switch';
import { mergeClassNames } from '@/lib/helpers/mergeClassNames';

interface Props {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  'aria-label': string;
  disabled?: boolean;
}

export function Toggle({
  checked,
  onCheckedChange,
  'aria-label': ariaLabel,
  disabled = false,
}: Props) {
  return (
    <Switch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={ariaLabel}
      disabled={disabled}
      className={mergeClassNames(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer',
        'rounded-full border-2 border-transparent',
        'transition-all duration-150 ease-out',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary',
        'disabled:opacity-50 disabled:pointer-events-none',
        checked ? 'bg-accent-primary' : 'bg-bg-elevated',
      )}
    >
      <Switch.Thumb
        className={mergeClassNames(
          'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg',
          'transition-transform duration-150 ease-out',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </Switch.Root>
  );
}
