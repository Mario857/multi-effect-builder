'use client';

import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import { VuMeter } from '@/components/shared/VuMeter';
import { Knob } from '@/components/shared/Knob';
import { useAudioStore } from '@/lib/store/audioStore';

const INPUT_LEVEL_SCALE = 5;
const DB_FLOOR = -60;

function levelToDb(level: number): number {
  if (level <= 0) return DB_FLOOR;
  const db = 20 * Math.log10(level);
  return Math.max(DB_FLOOR, Math.round(db));
}

export function MeterStrip() {
  const {
    inputLevel,
    outputLevel,
    masterVolume,
    setMasterVolume,
  } = useAudioStore();

  const inputDb = levelToDb(inputLevel);
  const outputDb = levelToDb(outputLevel);

  const inputDbLabel = inputDb <= DB_FLOOR ? '-inf' : `${inputDb}`;
  const outputDbLabel = outputDb <= DB_FLOOR ? '-inf' : `${outputDb}`;

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
          level={inputLevel * INPUT_LEVEL_SCALE}
          width={120}
          height={10}
          orientation="horizontal"
          aria-label="Input level meter"
        />
        <span className="w-10 text-right font-mono text-xs text-text-muted">
          {inputDbLabel}dB
        </span>
      </div>

      <Knob
        value={masterVolume}
        min={0}
        max={1}
        step={0.01}
        onChange={setMasterVolume}
        label="Master"
        size="sm"
      />

      <div className="flex items-center gap-3">
        <span className="w-10 text-left font-mono text-xs text-text-muted">
          {outputDbLabel}dB
        </span>
        <VuMeter
          level={outputLevel * INPUT_LEVEL_SCALE}
          width={120}
          height={10}
          orientation="horizontal"
          aria-label="Output level meter"
        />
        <span className="text-xs font-bold uppercase text-text-muted">Out</span>
      </div>
    </div>
  );
}
