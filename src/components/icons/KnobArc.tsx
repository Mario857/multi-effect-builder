import {
  KNOB_ARC_ANGLE_OFFSET,
  KNOB_ROTATION_OFFSET,
  KNOB_ROTATION_RANGE,
} from '@/lib/constants/ui';

const DEGREES_TO_RADIANS = Math.PI / 180;
const COORDINATE_DECIMALS = 3;

interface Props {
  size: number;
  radius: number;
  strokeWidth: number;
  progress: number;
}

function toRadians(rotationDegrees: number): number {
  return (rotationDegrees + KNOB_ARC_ANGLE_OFFSET) * DEGREES_TO_RADIANS;
}

/**
 * Value arc drawn around a knob: a dim track spanning the knob's whole travel
 * with an accent-coloured arc on top, running from the minimum up to `progress`.
 * @param size - Width and height of the square SVG in pixels
 * @param radius - Arc radius in pixels
 * @param strokeWidth - Arc stroke width in pixels
 * @param progress - Filled fraction of the travel, 0 (minimum) to 1 (maximum)
 */
export function KnobArc({ size, radius, strokeWidth, progress }: Props) {
  const center = size / 2;
  const startAngle = toRadians(KNOB_ROTATION_OFFSET);

  const arcPath = (sweepFraction: number) => {
    const endAngle = toRadians(KNOB_ROTATION_OFFSET + sweepFraction * KNOB_ROTATION_RANGE);
    // Rounded so server- and client-rendered markup match even if the two JS engines
    // disagree on the last bits of Math.sin / Math.cos.
    const x1 = (center + radius * Math.cos(startAngle)).toFixed(COORDINATE_DECIMALS);
    const y1 = (center + radius * Math.sin(startAngle)).toFixed(COORDINATE_DECIMALS);
    const x2 = (center + radius * Math.cos(endAngle)).toFixed(COORDINATE_DECIMALS);
    const y2 = (center + radius * Math.sin(endAngle)).toFixed(COORDINATE_DECIMALS);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  return (
    <svg
      className="absolute inset-0 fill-none"
      width={size}
      height={size}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d={arcPath(1)} className="stroke-glass-border" />
      <path d={arcPath(progress)} className="stroke-accent-primary drop-shadow-knob-arc" />
    </svg>
  );
}
