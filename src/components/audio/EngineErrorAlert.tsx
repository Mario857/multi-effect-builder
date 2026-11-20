'use client';

import { TriangleAlert } from 'lucide-react';
import { mergeClassNames } from '@/lib/helpers/mergeClassNames';

/**
 * Banner for an audio engine failure (a failed start or a failed input switch).
 * Mount it only while there is an error: `role="alert"` announces it when it appears.
 * @param message - The user-facing error message
 */
export function EngineErrorAlert({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className={mergeClassNames(
        'flex items-center justify-center gap-2 px-4 py-2',
        'border-b border-status-danger/30 bg-status-danger/10',
        'text-xs text-status-danger',
      )}
    >
      <TriangleAlert className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}
