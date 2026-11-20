'use client';

import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { KnobArc } from '@/components/icons/KnobArc';
import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import {
  DEFAULT_CONTROL_STEP,
  FOCUS_RING_CLASSES,
  INTERACTIVE_TRANSITION_CLASSES,
  KEYBOARD_KEY,
  KNOB_ARC_GAP,
  KNOB_ARC_MARGIN,
  KNOB_ARC_STROKE_WIDTH,
  KNOB_DRAG_RANGE_PX,
  KNOB_INDICATOR_INSET_RATIO,
  KNOB_INDICATOR_LENGTH_RATIO,
  KNOB_INDICATOR_WIDTH,
  KNOB_KEYBOARD_PAGE_STEPS,
  KNOB_KEYBOARD_STEPS,
  KNOB_KILO_DECIMALS,
  KNOB_KILO_THRESHOLD,
  KNOB_MAX_DECIMALS,
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

const PRIMARY_POINTER_BUTTON = 0;

type Size = keyof typeof SIZE_MAP;

interface Props {
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Value restored on double-click. Falls back to the midpoint of the range. */
  defaultValue?: number;
  onChange: (value: number) => void;
  label: string;
  size?: Size;
  showValue?: boolean;
  unit?: string;
  className?: string;
}

interface Drag {
  pointerId: number;
  startY: number;
  startValue: number;
}

interface Latest {
  value: number;
  min: number;
  max: number;
  step: number;
  defaultValue: number | undefined;
  onChange: (value: number) => void;
}

function clampValue(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

function countDecimals(val: number): number {
  let decimals = 0;
  while (decimals < KNOB_MAX_DECIMALS && Number(val.toFixed(decimals)) !== val) decimals++;
  return decimals;
}

/** Decimals needed to write any value on the `min + n * step` grid exactly. */
function getGridDecimals(min: number, step: number): number {
  return Math.max(countDecimals(min), countDecimals(step));
}

/**
 * Snaps to the nearest step counted from `min`, strips the float noise the
 * multiplication leaves behind (0.30000000000000004) and clamps last, so the
 * result can never leave [min, max].
 */
function snapToStep(val: number, min: number, max: number, step: number): number {
  if (step <= 0) return clampValue(val, min, max);
  const snapped = min + Math.round((val - min) / step) * step;
  const rounded = Number(snapped.toFixed(getGridDecimals(min, step)));
  return clampValue(rounded, min, max);
}

/** Largest whole number of steps that fits in 1/`divisions` of the range — at least one step. */
function getKeyboardIncrement(range: number, step: number, divisions: number): number {
  if (step <= 0) return range / divisions;
  return Math.max(1, Math.round(range / divisions / step)) * step;
}

function formatDisplayValue(value: number, decimals: number): string {
  if (Math.abs(value) >= KNOB_KILO_THRESHOLD) {
    return `${(value / KNOB_KILO_THRESHOLD).toFixed(KNOB_KILO_DECIMALS)}k`;
  }
  return value.toFixed(decimals);
}

// A draggable ancestor (e.g. a pedal that is reordered by HTML5 drag-and-drop) must never be
// dragged by turning the knob. The knob is itself marked `draggable` so that it — not the
// ancestor — becomes the drag source, and that drag is cancelled here before any ancestor
// `dragstart` handler can see it.
function cancelNativeDrag(event: React.DragEvent<HTMLDivElement>) {
  event.preventDefault();
  event.stopPropagation();
}

function KnobControl({
  value,
  min,
  max,
  step = DEFAULT_CONTROL_STEP,
  defaultValue,
  onChange,
  label,
  size = 'md',
  showValue = true,
  unit = '',
  className,
}: Props) {
  const dragRef = useRef<Drag | null>(null);

  // The event handlers read the current props from this ref instead of closing over them,
  // so they keep the same identity for the whole life of the knob.
  const latestRef = useRef<Latest>({ value, min, max, step, defaultValue, onChange });
  useEffect(() => {
    latestRef.current = { value, min, max, step, defaultValue, onChange };
  });

  const commitValue = useCallback((rawValue: number) => {
    const latest = latestRef.current;
    const nextValue = snapToStep(rawValue, latest.min, latest.max, latest.step);
    // Most pointermoves of a drag land on the step that is already set; skipping them
    // avoids a store update (and a re-render of every subscriber) per mouse event.
    if (nextValue === latest.value) return;
    // Remember what was emitted so that events arriving before the next render
    // (key repeat, fast drags) build on it instead of on the stale prop.
    latest.value = nextValue;
    latest.onChange(nextValue);
  }, []);

  const handlePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== PRIMARY_POINTER_BUTTON) return;
    // Cancelling pointerdown stops text selection and the mouse-driven native drag of a
    // draggable ancestor. It also cancels the default focus, so focus by hand to keep
    // the keyboard usable after a click.
    event.preventDefault();
    event.currentTarget.focus();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startY: event.clientY,
      startValue: latestRef.current.value,
    };
  }, []);

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      const { min: currentMin, max: currentMax } = latestRef.current;
      const deltaY = drag.startY - event.clientY;
      const deltaValue = (deltaY / KNOB_DRAG_RANGE_PX) * (currentMax - currentMin);
      commitValue(drag.startValue + deltaValue);
    },
    [commitValue],
  );

  // Shared by pointerup, pointercancel and lostpointercapture: whichever way the gesture
  // ends, later pointermoves (plain hovering) must not keep turning the knob.
  const handlePointerEnd = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleDoubleClick = useCallback(() => {
    const latest = latestRef.current;
    commitValue(latest.defaultValue ?? (latest.min + latest.max) / 2);
  }, [commitValue]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      // Leave browser / OS shortcuts such as Alt+ArrowLeft (history back) alone.
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const latest = latestRef.current;
      const range = latest.max - latest.min;
      const arrowIncrement = event.shiftKey
        ? latest.step
        : getKeyboardIncrement(range, latest.step, KNOB_KEYBOARD_STEPS);
      const pageIncrement = getKeyboardIncrement(range, latest.step, KNOB_KEYBOARD_PAGE_STEPS);

      const targetValue = (() => {
        switch (event.key) {
          case KEYBOARD_KEY.ARROW_UP:
          case KEYBOARD_KEY.ARROW_RIGHT:
            return latest.value + arrowIncrement;
          case KEYBOARD_KEY.ARROW_DOWN:
          case KEYBOARD_KEY.ARROW_LEFT:
            return latest.value - arrowIncrement;
          case KEYBOARD_KEY.PAGE_UP:
            return latest.value + pageIncrement;
          case KEYBOARD_KEY.PAGE_DOWN:
            return latest.value - pageIncrement;
          case KEYBOARD_KEY.HOME:
            return latest.min;
          case KEYBOARD_KEY.END:
            return latest.max;
          default:
            return null;
        }
      })();
      if (targetValue === null) return;

      // Handled keys must not also scroll the page.
      event.preventDefault();
      commitValue(targetValue);
    },
    [commitValue],
  );

  const pixelSize = SIZE_MAP[size];
  const range = max - min;
  // Clamped so that an out-of-range value (e.g. from an old saved preset) still draws a sane knob.
  const progress = range > 0 ? clampValue((value - min) / range, 0, 1) : 0;
  const rotation = KNOB_ROTATION_OFFSET + progress * KNOB_ROTATION_RANGE;

  // Shown with exactly the precision of the step grid: 0.35, -18dB, 0.003s, 3.0kHz.
  const decimals = useMemo(() => getGridDecimals(min, step), [min, step]);
  const displayValue = formatDisplayValue(value, decimals);
  const valueText = `${value.toFixed(decimals)}${unit}`;

  const indicatorLength = pixelSize * KNOB_INDICATOR_LENGTH_RATIO;
  const indicatorInset = pixelSize * KNOB_INDICATOR_INSET_RATIO;

  // SVG arc track
  const svgSize = pixelSize + KNOB_ARC_MARGIN * 2;
  const arcRadius = pixelSize / 2 + KNOB_ARC_GAP;

  const valueLabel = showValue ? (
    <span className="max-w-full truncate text-xs font-mono text-text-muted">
      {displayValue}{unit}
    </span>
  ) : null;

  return (
    <div className={mergeClassNames('flex flex-col items-center gap-1', className)}>
      <div className="relative" style={{ width: svgSize, height: svgSize }}>
        <KnobArc
          size={svgSize}
          radius={arcRadius}
          strokeWidth={KNOB_ARC_STROKE_WIDTH}
          progress={progress}
        />
        <div
          role="slider"
          tabIndex={0}
          draggable
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-valuetext={valueText}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onLostPointerCapture={handlePointerEnd}
          onDoubleClick={handleDoubleClick}
          onKeyDown={handleKeyDown}
          onDragStart={cancelNativeDrag}
          className={mergeClassNames(
            'absolute cursor-grab rounded-full',
            // touch-none: a vertical touch drag must turn the knob, not scroll the page
            // (the browser would otherwise take over the gesture and cancel the pointer).
            'touch-none select-none',
            'bg-linear-to-b from-bg-hover to-bg-elevated',
            'border border-border-strong',
            'shadow-(--shadow-knob)',
            INTERACTIVE_TRANSITION_CLASSES,
            'hover:border-accent-primary/50',
            FOCUS_RING_CLASSES,
            'active:cursor-grabbing',
          )}
          style={{
            width: pixelSize,
            height: pixelSize,
            left: KNOB_ARC_MARGIN,
            top: KNOB_ARC_MARGIN,
          }}
        >
          <div
            className="absolute inset-0"
            style={{ transform: `rotate(${rotation}deg)` }}
          >
            <div
              className={mergeClassNames(
                'absolute left-1/2 -translate-x-1/2 rounded-full',
                'bg-accent-primary shadow-(--shadow-knob-indicator)',
              )}
              style={{
                width: KNOB_INDICATOR_WIDTH,
                height: indicatorLength,
                top: indicatorInset,
              }}
            />
          </div>
        </div>
      </div>
      {valueLabel}
      <span className="max-w-full truncate text-xs text-text-secondary">{label}</span>
    </div>
  );
}

/**
 * Rotary control with slider semantics.
 *
 * - Drag vertically (mouse, touch or pen) to turn; `KNOB_DRAG_RANGE_PX` sweeps the whole range.
 * - Keyboard: arrows nudge (Shift = a single `step`), PageUp / PageDown jump, Home / End go to
 *   `min` / `max`.
 * - Double-click resets to `defaultValue` (the midpoint of the range when it is not given).
 *
 * Emitted values are always on the `min + n * step` grid, inside [min, max] and free of float
 * noise, and `onChange` only fires when the value actually changes. The component is memoised:
 * pass a stable `onChange` to keep a knob from re-rendering with its parent.
 */
export const Knob = memo(KnobControl);
