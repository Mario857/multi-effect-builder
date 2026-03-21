'use client';

import { Guitar, Mic, Activity } from 'lucide-react';
import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import { Toggle } from '@/components/shared/Toggle';
import { Knob } from '@/components/shared/Knob';
import { VuMeter } from '@/components/shared/VuMeter';
import { IconButton } from '@/components/shared/IconButton';
import { useAudioStore } from '@/lib/store/audioStore';
import { useAudioInput } from '@/hooks/useAudioInput';

interface Props {
  onStartEngine: () => void;
  isEngineRunning: boolean;
}

export function Header({ onStartEngine, isEngineRunning }: Props) {
  const {
    isMonitoring,
    masterVolume,
    inputLevel,
    outputLevel,
    isTunerActive,
    setMonitoring,
    setMasterVolume,
    setTunerActive,
  } = useAudioStore();

  const { audioInputDevices, inputDeviceId, setInputDeviceId } = useAudioInput();

  const engineButton = isEngineRunning ? (
    <span className="flex items-center gap-1.5 text-xs text-status-success">
      <span className="h-2 w-2 rounded-full bg-status-success animate-pulse" />
      Live
    </span>
  ) : (
    <button
      type="button"
      onClick={onStartEngine}
      className={mergeClassNames(
        'flex items-center gap-1.5',
        'rounded-lg px-3 py-1.5',
        'bg-accent-primary text-text-inverse text-xs font-medium',
        'transition-all duration-150 ease-out',
        'hover:bg-accent-primary-hover',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary',
      )}
    >
      <Guitar className="h-3.5 w-3.5" />
      Start Audio
    </button>
  );

  return (
    <header
      className={mergeClassNames(
        'flex items-center justify-between gap-4',
        'h-14 px-4',
        'border-b border-border-subtle bg-bg-secondary',
      )}
    >
      <div className="flex items-center gap-3">
        <Guitar className="h-5 w-5 text-accent-primary" />
        <span className="text-sm font-bold tracking-tight">MultiEffect</span>
        {engineButton}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Mic className="h-3.5 w-3.5 text-text-muted" />
          <select
            value={inputDeviceId}
            onChange={(e) => setInputDeviceId(e.target.value)}
            aria-label="Select audio input device"
            className={mergeClassNames(
              'rounded-md px-2 py-1',
              'bg-bg-elevated border border-border-default',
              'text-xs text-text-primary',
              'focus-visible:outline-2 focus-visible:outline-accent-primary',
            )}
          >
            {audioInputDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Input ${device.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Monitor</span>
          <Toggle
            checked={isMonitoring}
            onCheckedChange={setMonitoring}
            aria-label="Toggle audio monitoring"
          />
        </div>

        <div className="flex items-center gap-2">
          <VuMeter
            level={inputLevel * 5}
            width={8}
            height={28}
            aria-label="Input level meter"
          />
          <span className="text-xs text-text-muted">IN</span>
        </div>

        <Knob
          value={masterVolume}
          min={0}
          max={1}
          step={0.01}
          onChange={setMasterVolume}
          label="Master"
          size="sm"
          showValue={false}
        />

        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">OUT</span>
          <VuMeter
            level={outputLevel * 5}
            width={8}
            height={28}
            aria-label="Output level meter"
          />
        </div>

        <IconButton
          aria-label="Toggle tuner"
          onClick={() => setTunerActive(!isTunerActive)}
          className={isTunerActive ? 'text-accent-primary' : undefined}
        >
          <Activity className="h-4 w-4" />
        </IconButton>
      </div>
    </header>
  );
}
