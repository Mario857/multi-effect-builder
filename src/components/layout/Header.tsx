'use client';

import { Guitar, Mic, Activity } from 'lucide-react';
import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import { Toggle } from '@/components/shared/Toggle';
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
    isTunerActive,
    setMonitoring,
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
        'bg-gradient-to-r from-accent-primary to-accent-primary-hover',
        'text-text-inverse text-xs font-medium',
        'transition-all duration-150 ease-out',
        'hover:brightness-110 hover:shadow-(--shadow-glow-amber)',
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
        'border-b border-border-subtle bg-bg-secondary/80 backdrop-blur-md',
        'header-glow',
      )}
    >
      <div className="flex shrink-0 items-center gap-3">
        <Guitar className="h-5 w-5 text-accent-primary" />
        <span className="font-pixel text-xs tracking-tight text-accent-primary">MultiFX</span>
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
