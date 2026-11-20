'use client';

import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import { VuMeter } from '@/components/shared/VuMeter';
import { Knob } from '@/components/shared/Knob';
import {
  MASTER_VOLUME_DEFAULT,
  MASTER_VOLUME_MAX,
  MASTER_VOLUME_MIN,
} from '@/lib/constants/audio';
import { LEVEL_METER_HEIGHT, LEVEL_METER_WIDTH } from '@/lib/constants/ui';
import { useMeterStrip } from '@/hooks/useMeterStrip';

// Wide enough for the longest readout ("-inf dB") on one line
const DB_READOUT_CLASSES = 'w-14 whitespace-nowrap font-mono text-xs text-text-muted';

/** Input and output level meters with their dB readouts, and the master volume knob between them. */
export function MeterStrip() {
  const {
    inputMeterLevel,
    outputMeterLevel,
    inputDbLabel,
    outputDbLabel,
    masterVolume,
    setMasterVolume,
  } = useMeterStrip();

  return (
    <div
      className={mergeClassNames(
        'flex items-center justify-center gap-8 px-4 py-2',
        'border-b border-border-subtle bg-bg-primary/60',
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold uppercase text-text-muted">In</span>
        <VuMeter
          level={inputMeterLevel}
          width={LEVEL_METER_WIDTH}
          height={LEVEL_METER_HEIGHT}
          orientation="horizontal"
          aria-label="Input level meter"
        />
        <span className={mergeClassNames(DB_READOUT_CLASSES, 'text-right')}>{inputDbLabel}</span>
      </div>

      <Knob
        value={masterVolume}
        min={MASTER_VOLUME_MIN}
        max={MASTER_VOLUME_MAX}
        defaultValue={MASTER_VOLUME_DEFAULT}
        onChange={setMasterVolume}
        label="Master"
        size="sm"
      />

      <div className="flex items-center gap-3">
        <span className={mergeClassNames(DB_READOUT_CLASSES, 'text-left')}>{outputDbLabel}</span>
        <VuMeter
          level={outputMeterLevel}
          width={LEVEL_METER_WIDTH}
          height={LEVEL_METER_HEIGHT}
          orientation="horizontal"
          aria-label="Output level meter"
        />
        <span className="text-xs font-bold uppercase text-text-muted">Out</span>
      </div>
    </div>
  );
}
