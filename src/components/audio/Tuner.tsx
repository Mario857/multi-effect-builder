'use client';

import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import { CENTS_THRESHOLD_IN_TUNE } from '@/lib/constants/audio';
import { useTuner } from '@/hooks/useTuner';

const CENTS_RANGE = 50;
const INDICATOR_SEGMENTS = 21;
const CENTER_INDEX = Math.floor(INDICATOR_SEGMENTS / 2);

export function Tuner() {
  // The tuner owns its readings so that their ~20 updates per second re-render only this component
  const { reading } = useTuner();
  const isInTune = reading ? Math.abs(reading.centsOff) <= CENTS_THRESHOLD_IN_TUNE : false;

  const noSignalContent = (
    <div className="flex flex-col items-center gap-2 py-4">
      <span className="font-pixel text-xl text-text-muted">--</span>
      <span className="text-xs text-text-muted">Play a note</span>
    </div>
  );

  const tunerDisplay = reading ? (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="flex items-baseline gap-1">
        <span
          className={mergeClassNames(
            'font-pixel text-2xl',
            isInTune ? 'text-status-success' : 'text-text-primary',
          )}
        >
          {reading.note}
        </span>
        <span className="text-lg text-text-muted">{reading.octave}</span>
      </div>

      <div className="flex items-center gap-0.5">
        {Array.from({ length: INDICATOR_SEGMENTS }, (_, i) => {
          const segmentCents = ((i - CENTER_INDEX) / CENTER_INDEX) * CENTS_RANGE;
          const isActive = reading.centsOff >= 0
            ? segmentCents >= 0 && segmentCents <= reading.centsOff
            : segmentCents <= 0 && segmentCents >= reading.centsOff;
          const isCenter = i === CENTER_INDEX;

          return (
            <div
              key={i}
              className={mergeClassNames(
                'h-4 w-1.5 rounded-sm',
                'transition-all duration-75',
                isCenter && 'w-2 h-5',
                isActive && isInTune && 'bg-status-success',
                isActive && !isInTune && 'bg-status-warning',
                !isActive && 'bg-bg-elevated',
              )}
            />
          );
        })}
      </div>

      <div className="flex items-center gap-4 text-xs">
        <span className="text-text-muted">
          {reading.frequency.toFixed(1)} Hz
        </span>
        <span
          className={mergeClassNames(
            'font-mono font-medium',
            isInTune ? 'text-status-success' : 'text-status-warning',
          )}
        >
          {reading.centsOff > 0 ? '+' : ''}{reading.centsOff}¢
        </span>
      </div>
    </div>
  ) : null;

  return (
    <div
      className={mergeClassNames(
        'rounded-xl p-4',
        'glass-card card-highlight text-center',
      )}
    >
      <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
        Tuner
      </span>
      {reading ? tunerDisplay : noSignalContent}
    </div>
  );
}
