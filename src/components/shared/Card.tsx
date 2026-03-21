'use client';

import { mergeClassNames } from '@/lib/helpers/mergeClassNames';

interface Props {
  children: React.ReactNode;
  className?: string;
}

export function Card({ children, className }: Props) {
  return (
    <div
      className={mergeClassNames(
        'rounded-xl border border-border-default',
        'bg-bg-surface',
        className,
      )}
    >
      {children}
    </div>
  );
}
