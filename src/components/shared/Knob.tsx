'use client';

import { useCallback, useRef } from 'react';
import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import {
  KNOB_ROTATION_RANGE,
  KNOB_ROTATION_OFFSET,
  KNOB_SIZE_SM,
  KNOB_SIZE_MD,
  KNOB_SIZE_LG,
} from '@/lib/constants/ui';

const SIZE_MAP = {
  sm: KNOB_SIZE_SM,
  md: KNOB_SIZE_MD,
  lg: KNOB_SIZE_LG,
} as const;

type Size = keyof typeof SIZE_MAP;

interface Props {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  label: string;
  size?: Size;
  showValue?: boolean;
  unit?: string;
  className?: string;
}

function clampValue(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

function valueToRotation(value: number, min: number, max: number): number {
  const normalized = (value - min) / (max - min);
  return KNOB_ROTATION_OFFSET + normalized * KNOB_ROTATION_RANGE;
}

function formatDisplayValue(value: number): string {
  const absValue = Math.abs(value);
  if (absValue >= 1000) return `${(value / 1000).toFixed(1)}k`;
  if (absValue < 0.01) return value.toFixed(3);
  if (absValue < 1) return value.toFixed(2);
  return value.toFixed(absValue >= 100 ? 0 : 1);
}

export function Knob({
  value,
  min,
  max,
  step = 0.01,
  onChange,
  label,
  size = 'md',
  showValue = true,
  unit = '',
  className,
}: Props) {
  const dragStartRef = useRef<{ y: number; startValue: number } | null>(null);
  const pixelSize = SIZE_MAP[size];

  const handlePointerDown = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();
      const target = event.currentTarget as HTMLElement;
      target.setPointerCapture(event.pointerId);
      dragStartRef.current = { y: event.clientY, startValue: value };
    },
    [value],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent) => {
      if (!dragStartRef.current) return;
      const dragSensitivity = 200;
      const deltaY = dragStartRef.current.y - event.clientY;
      const range = max - min;
      const deltaValue = (deltaY / dragSensitivity) * range;
      const newValue = clampValue(dragStartRef.current.startValue + deltaValue, min, max);
      const steppedValue = Math.round(newValue / step) * step;
      onChange(steppedValue);
    },
    [min, max, step, onChange],
  );

  const handlePointerUp = useCallback(() => {
    dragStartRef.current = null;
  }, []);

  const handleDoubleClick = useCallback(() => {
    const defaultValue = (min + max) / 2;
    onChange(Math.round(defaultValue / step) * step);
  }, [min, max, step, onChange]);

  const rotation = valueToRotation(value, min, max);
  const displayValue = formatDisplayValue(value);

  const indicatorLength = pixelSize * 0.3;
  const indicatorOffset = pixelSize * 0.1;

  return (
    <div className={mergeClassNames('flex flex-col items-center gap-1', className)}>
      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        className={mergeClassNames(
          'relative cursor-grab rounded-full',
          'bg-bg-elevated border-2 border-border-strong',
          'transition-shadow duration-150 ease-out',
          'hover:border-accent-primary hover:shadow-(--shadow-knob)',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary',
          'active:cursor-grabbing',
        )}
        style={{ width: pixelSize, height: pixelSize }}
      >
        <div
          className="absolute inset-0"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full bg-accent-primary"
            style={{
              width: 3,
              height: indicatorLength,
              top: indicatorOffset,
            }}
          />
        </div>
      </div>
      {showValue && (
        <span className="text-xs font-mono text-text-muted">
          {displayValue}{unit}
        </span>
      )}
      <span className="text-xs text-text-secondary">{label}</span>
    </div>
  );
}
