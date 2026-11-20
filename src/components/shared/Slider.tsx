'use client';

import * as RadixSlider from '@radix-ui/react-slider';
import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import { DEFAULT_CONTROL_STEP, FOCUS_RING_CLASSES } from '@/lib/constants/ui';

interface Props {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  'aria-label': string;
  className?: string;
}

/**
 * Horizontal slider for a single value (Radix Slider: full keyboard and touch support).
 * `aria-label` names the thumb, which is the element assistive technology announces.
 */
export function Slider({
  value,
  min,
  max,
  step = DEFAULT_CONTROL_STEP,
  onChange,
  'aria-label': ariaLabel,
  className,
}: Props) {
  const handleValueChange = (values: number[]) => {
    onChange(values[0]);
  };

  return (
    <RadixSlider.Root
      value={[value]}
      min={min}
      max={max}
      step={step}
      onValueChange={handleValueChange}
      className={mergeClassNames(
        'relative flex h-5 w-full touch-none items-center select-none',
        className,
      )}
    >
      <RadixSlider.Track
        className={mergeClassNames(
          'relative h-1 w-full grow rounded-full',
          'bg-bg-elevated',
        )}
      >
        <RadixSlider.Range className="absolute h-full rounded-full bg-accent-primary" />
      </RadixSlider.Track>
      {/* The thumb is the element with role="slider", so the label has to go on it:
          Radix does not forward the root's aria-label. */}
      <RadixSlider.Thumb
        aria-label={ariaLabel}
        className={mergeClassNames(
          'block h-4 w-4 rounded-full',
          'bg-text-primary shadow-sm',
          'transition-shadow duration-150 ease-out',
          'hover:shadow-(--shadow-knob)',
          FOCUS_RING_CLASSES,
        )}
      />
    </RadixSlider.Root>
  );
}
