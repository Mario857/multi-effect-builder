'use client';

import { useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAudioStore } from '@/lib/store/audioStore';

interface Options {
  /** True while the engine is loading or waiting for microphone permission. */
  isEngineStarting: boolean;
  onStartEngine: () => void;
}

/** State and handlers of the header's controls. */
export interface HeaderControlsState {
  /** When false the speakers are muted while the meters and the tuner keep running. */
  readonly isMonitoring: boolean;
  readonly isTunerActive: boolean;
  /** Ref for the button that starts and stops the engine. */
  readonly engineButtonRef: React.RefObject<HTMLButtonElement | null>;
  readonly handleStartEngine: () => void;
  readonly setMonitoring: (isMonitoring: boolean) => void;
  readonly handleToggleTuner: () => void;
}

/**
 * State of the header: the monitor switch, the tuner button and the keyboard focus of
 * the engine button across a start.
 * @returns The settings, the handlers that change them and the engine button's ref
 */
export function useHeaderControls({ isEngineStarting, onStartEngine }: Options): HeaderControlsState {
  const { isMonitoring, isTunerActive, setMonitoring, setTunerActive } = useAudioStore(
    useShallow((state) => ({
      isMonitoring: state.isMonitoring,
      isTunerActive: state.isTunerActive,
      setMonitoring: state.setMonitoring,
      setTunerActive: state.setTunerActive,
    })),
  );

  const engineButtonRef = useRef<HTMLButtonElement>(null);
  // Set when a start is requested, until the focus has been handed back to the engine button
  const isFocusRestorePendingRef = useRef(false);

  // The engine button is disabled while the engine starts, and browsers take the focus away
  // from a control that becomes disabled. Hand it back once the start has finished (or
  // failed), unless the user has focused something else in the meantime.
  useEffect(() => {
    if (isEngineStarting || !isFocusRestorePendingRef.current) return;
    isFocusRestorePendingRef.current = false;
    if (document.activeElement === document.body) engineButtonRef.current?.focus();
  }, [isEngineStarting]);

  const handleStartEngine = () => {
    isFocusRestorePendingRef.current = true;
    onStartEngine();
  };

  const handleToggleTuner = () => {
    setTunerActive(!isTunerActive);
  };

  return {
    isMonitoring,
    isTunerActive,
    engineButtonRef,
    handleStartEngine,
    setMonitoring,
    handleToggleTuner,
  };
}
