'use client';

import { useCallback, useRef } from 'react';
import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import {
  KNOB_ROTATION_RANGE,
  KNOB_ROTATION_OFFSET,
  KNOB_SIZE_XS,
  KNOB_SIZE_SM,
  KNOB_SIZE_MD,
  KNOB_SIZE_LG,
} from '@/lib/constants/ui';

const SIZE_MAP = {
  xs: KNOB_SIZE_XS,
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

  // SVG arc track
  const svgSize = pixelSize + 12;
  const arcRadius = pixelSize / 2 + 4;
  const arcCenter = svgSize / 2;
  const normalized = (value - min) / (max - min);
  const startAngle = (KNOB_ROTATION_OFFSET - 90) * (Math.PI / 180);
  const endAngleFull = ((KNOB_ROTATION_OFFSET + KNOB_ROTATION_RANGE) - 90) * (Math.PI / 180);
  const endAngleValue = (KNOB_ROTATION_OFFSET + normalized * KNOB_ROTATION_RANGE - 90) * (Math.PI / 180);

  const arcPath = (endAngle: number) => {
    const x1 = arcCenter + arcRadius * Math.cos(startAngle);
    const y1 = arcCenter + arcRadius * Math.sin(startAngle);
    const x2 = arcCenter + arcRadius * Math.cos(endAngle);
    const y2 = arcCenter + arcRadius * Math.sin(endAngle);
    const angleDiff = endAngle - startAngle;
    const largeArc = angleDiff > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${arcRadius} ${arcRadius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  return (
    <div className={mergeClassNames('flex flex-col items-center gap-1', className)}>
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <svg
          className="absolute inset-0"
          width={svgSize}
          height={svgSize}
          aria-hidden="true"
        >
          <path
            d={arcPath(endAngleFull)}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <path
            d={arcPath(endAngleValue)}
            fill="none"
            stroke="var(--color-accent-primary)"
            strokeWidth={2.5}
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 3px rgba(245, 158, 11, 0.4))' }}
          />
        </svg>
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
            'absolute cursor-grab rounded-full',
            'bg-gradient-to-b from-bg-hover to-bg-elevated',
            'border border-border-strong',
            'shadow-(--shadow-knob)',
            'transition-shadow duration-150 ease-out',
            'hover:border-accent-primary/50',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary',
            'active:cursor-grabbing',
          )}
          style={{
            width: pixelSize,
            height: pixelSize,
            left: (svgSize - pixelSize) / 2,
            top: (svgSize - pixelSize) / 2,
          }}
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
                boxShadow: '0 0 4px rgba(245, 158, 11, 0.5)',
              }}
            />
          </div>
        </div>
      </div>
      {showValue && (
        <span className="max-w-full truncate text-xs font-mono text-text-muted">
          {displayValue}{unit}
        </span>
      )}
      <span className="max-w-full truncate text-xs text-text-secondary">{label}</span>
    </div>
  );
}
