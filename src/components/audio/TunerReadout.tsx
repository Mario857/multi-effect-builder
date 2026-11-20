'use client';

import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import type { TunerNote, TunerSegment } from '@/hooks/useTunerDisplay';

function getSegmentColorClass(segment: TunerSegment, isInTune: boolean): string {
  if (!segment.isActive) return 'bg-bg-elevated';
  return isInTune ? 'bg-status-success' : 'bg-status-warning';
}

/**
 * The tuner's display for a detected note: note name and octave, the cents indicator
 * and the frequency / deviation readouts.
 * @param tunerNote - The detected note, as prepared by `useTunerDisplay`
 */
export function TunerReadout({ tunerNote }: { tunerNote: TunerNote }) {
  const { isInTune } = tunerNote;

  const segments = tunerNote.segments.map((segment) => (
    <span
      key={segment.index}
      className={mergeClassNames(
        'h-4 w-1.5 rounded-sm',
        'transition-all duration-75',
        segment.isCenter && 'h-5 w-2',
        getSegmentColorClass(segment, isInTune),
      )}
    />
  ));

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-baseline gap-1">
        <span
          className={mergeClassNames(
            'font-pixel text-2xl',
            isInTune ? 'text-status-success' : 'text-text-primary',
          )}
        >
          {tunerNote.note}
        </span>
        <span className="text-lg text-text-muted">{tunerNote.octave}</span>
      </div>

      <div className="flex items-center gap-0.5" aria-hidden="true">
        {segments}
      </div>

      <div className="flex items-center gap-4 text-xs">
        <span className="text-text-muted">{tunerNote.frequencyLabel}</span>
        <span
          className={mergeClassNames(
            'font-mono font-medium',
            isInTune ? 'text-status-success' : 'text-status-warning',
          )}
        >
          {tunerNote.centsLabel}
        </span>
      </div>
    </div>
  );
}
