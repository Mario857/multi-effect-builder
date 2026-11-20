'use client';

import { Activity, Guitar, LoaderCircle, Square, Volume2, VolumeX } from 'lucide-react';
import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import { InputDeviceSelect } from '@/components/audio/InputDeviceSelect';
import { Button } from '@/components/shared/Button';
import { IconButton } from '@/components/shared/IconButton';
import { Toggle } from '@/components/shared/Toggle';
import { useHeaderControls } from '@/hooks/useHeaderControls';

interface Props {
  isEngineRunning: boolean;
  /** True while the engine is loading or waiting for microphone permission. */
  isEngineStarting: boolean;
  onStartEngine: () => void;
  /** Stops the engine, which is what releases the microphone. */
  onStopEngine: () => void;
}

/**
 * App header: the logo, the control that starts and stops the audio engine with its
 * status, the input picker, the monitor switch and the tuner button.
 */
export function Header({ isEngineRunning, isEngineStarting, onStartEngine, onStopEngine }: Props) {
  const {
    isMonitoring,
    isTunerActive,
    engineButtonRef,
    handleStartEngine,
    setMonitoring,
    handleToggleTuner,
  } = useHeaderControls({ isEngineStarting, onStartEngine });

  // One button slot (and so one DOM node) for all three states: the keyboard focus can
  // stay on it while the engine goes from stopped to starting to running and back
  const engineButton = (() => {
    if (isEngineRunning) {
      return (
        <Button
          ref={engineButtonRef}
          variant="secondary"
          size="sm"
          onClick={onStopEngine}
          aria-label="Stop audio and release the microphone"
        >
          <Square className="h-3 w-3" />
          Stop
        </Button>
      );
    }
    if (isEngineStarting) {
      return (
        <Button ref={engineButtonRef} variant="accent" size="sm" disabled aria-label="Starting audio">
          <LoaderCircle className="h-3.5 w-3.5 motion-safe:animate-spin" />
          Starting…
        </Button>
      );
    }
    return (
      <Button
        ref={engineButtonRef}
        variant="accent"
        size="sm"
        onClick={handleStartEngine}
        aria-label="Start audio"
      >
        <Guitar className="h-3.5 w-3.5" />
        Start Audio
      </Button>
    );
  })();

  const liveIndicator = isEngineRunning ? (
    <>
      <span className="h-2 w-2 rounded-full bg-status-success motion-safe:animate-pulse" />
      Live
    </>
  ) : null;

  const monitorIcon = isMonitoring ? (
    <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
  ) : (
    <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
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
        <Guitar className="h-5 w-5 text-accent-primary" aria-hidden="true" />
        <h1 className="font-pixel text-xs tracking-tight text-accent-primary">MultiFX</h1>
        {engineButton}
        {/* Always mounted, so that screen readers announce "Live" when it appears */}
        <span role="status" className="flex items-center gap-1.5 text-xs text-status-success">
          {liveIndicator}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <InputDeviceSelect />

        <div className="flex items-center gap-2 text-xs text-text-muted">
          {monitorIcon}
          Monitor
          <Toggle
            checked={isMonitoring}
            onCheckedChange={setMonitoring}
            aria-label="Monitor: play the processed sound through the speakers"
          />
        </div>

        <IconButton aria-label="Tuner" isActive={isTunerActive} onClick={handleToggleTuner}>
          <Activity />
        </IconButton>
      </div>
    </header>
  );
}
