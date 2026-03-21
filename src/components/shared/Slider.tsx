'use client';

import * as RadixSlider from '@radix-ui/react-slider';
import { mergeClassNames } from '@/lib/helpers/mergeClassNames';

interface Props {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  'aria-label': string;
  className?: string;
}

export function Slider({
  value,
  min,
  max,
  step = 0.01,
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
      aria-label={ariaLabel}
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
      <RadixSlider.Thumb
        className={mergeClassNames(
          'block h-4 w-4 rounded-full',
          'bg-text-primary shadow-sm',
          'transition-shadow duration-150 ease-out',
          'hover:shadow-(--shadow-knob)',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary',
        )}
      />
    </RadixSlider.Root>
  );
}
