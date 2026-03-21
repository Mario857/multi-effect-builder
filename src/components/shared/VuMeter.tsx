'use client';

import { useRef, useEffect } from 'react';
import { mergeClassNames } from '@/lib/helpers/mergeClassNames';

const METER_SEGMENTS = 20;
const GREEN_THRESHOLD = 0.6;
const YELLOW_THRESHOLD = 0.85;
const GREEN_COLOR = '#22c55e';
const YELLOW_COLOR = '#eab308';
const RED_COLOR = '#ef4444';
const INACTIVE_COLOR = '#1e1e34';
const SEGMENT_GAP = 2;

interface Props {
  level: number;
  width?: number;
  height?: number;
  orientation?: 'vertical' | 'horizontal';
  'aria-label': string;
  className?: string;
}

export function VuMeter({
  level,
  width = 12,
  height = 80,
  orientation = 'vertical',
  'aria-label': ariaLabel,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const isVertical = orientation === 'vertical';
    const totalLength = isVertical ? height : width;
    const barThickness = isVertical ? width : height;
    const segmentLength = (totalLength - (METER_SEGMENTS - 1) * SEGMENT_GAP) / METER_SEGMENTS;

    for (let i = 0; i < METER_SEGMENTS; i++) {
      const segmentNormalized = i / METER_SEGMENTS;
      const isActive = segmentNormalized < level;

      let color = INACTIVE_COLOR;
      if (isActive) {
        if (segmentNormalized < GREEN_THRESHOLD) color = GREEN_COLOR;
        else if (segmentNormalized < YELLOW_THRESHOLD) color = YELLOW_COLOR;
        else color = RED_COLOR;
      }

      ctx.fillStyle = color;

      if (isVertical) {
        const y = height - (i + 1) * (segmentLength + SEGMENT_GAP);
        ctx.fillRect(0, y, barThickness, segmentLength);
      } else {
        const x = i * (segmentLength + SEGMENT_GAP);
        ctx.fillRect(x, 0, segmentLength, barThickness);
      }
    }
  }, [level, width, height, orientation]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={ariaLabel}
      role="meter"
      aria-valuenow={Math.round(level * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={mergeClassNames('rounded', className)}
      style={{ width, height }}
    />
  );
}
