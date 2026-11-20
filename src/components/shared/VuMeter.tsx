'use client';

import { useMemo } from 'react';
import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import {
  VU_METER_ARIA_MAX,
  VU_METER_DEFAULT_HEIGHT,
  VU_METER_DEFAULT_WIDTH,
  VU_METER_HIGH_THRESHOLD,
  VU_METER_MID_THRESHOLD,
  VU_METER_SEGMENTS,
} from '@/lib/constants/ui';

const SEGMENT_INDEXES = Array.from({ length: VU_METER_SEGMENTS }, (_, index) => index);

interface Props {
  level: number;
  width?: number;
  height?: number;
  orientation?: 'vertical' | 'horizontal';
  'aria-label': string;
  className?: string;
}

function getSegmentColorClass(index: number, activeCount: number): string {
  const isActive = index < activeCount;
  if (!isActive) return 'bg-meter-off';
  const position = index / VU_METER_SEGMENTS;
  if (position < VU_METER_MID_THRESHOLD) return 'bg-meter-low';
  if (position < VU_METER_HIGH_THRESHOLD) return 'bg-meter-mid';
  return 'bg-meter-high';
}

/**
 * Segmented level meter.
 *
 * Drawn with plain elements coloured by theme tokens rather than a canvas: the level changes
 * ~20 times a second, and the segment list is only rebuilt when the number of lit segments
 * changes, so most updates touch nothing but `aria-valuenow`.
 * @param level - Signal level; 0 is silence, 1 (or more) lights every segment
 * @param width - Width in pixels
 * @param height - Height in pixels
 * @param orientation - `vertical` fills bottom-to-top, `horizontal` left-to-right
 */
export function VuMeter({
  level,
  width = VU_METER_DEFAULT_WIDTH,
  height = VU_METER_DEFAULT_HEIGHT,
  orientation = 'vertical',
  'aria-label': ariaLabel,
  className,
}: Props) {
  // Callers scale raw levels up for visibility (e.g. `level * 5`), so the input can exceed 1.
  const clampedLevel = Math.min(1, Math.max(0, level));
  const activeCount = Math.ceil(clampedLevel * VU_METER_SEGMENTS);

  const segments = useMemo(
    () =>
      SEGMENT_INDEXES.map((index) => (
        <span
          key={index}
          className={mergeClassNames('flex-1', getSegmentColorClass(index, activeCount))}
        />
      )),
    [activeCount],
  );

  return (
    <div
      role="meter"
      aria-label={ariaLabel}
      aria-valuenow={Math.round(clampedLevel * VU_METER_ARIA_MAX)}
      aria-valuemin={0}
      aria-valuemax={VU_METER_ARIA_MAX}
      className={mergeClassNames(
        'inline-flex shrink-0 gap-0.5 overflow-hidden rounded',
        orientation === 'vertical' ? 'flex-col-reverse' : 'flex-row',
        className,
      )}
      style={{ width, height }}
    >
      {segments}
    </div>
  );
}
