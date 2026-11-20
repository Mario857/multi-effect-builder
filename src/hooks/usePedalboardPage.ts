'use client';

import { useState, useCallback } from 'react';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useAudioStore } from '@/lib/store/audioStore';

/** Everything the pedalboard page needs to compose its components. */
export interface PedalboardPageState {
  readonly isEngineRunning: boolean;
  /** True while the engine is loading or waiting for microphone permission. */
  readonly isEngineStarting: boolean;
  /** Message of the last failed start or input switch, null when there is none. */
  readonly engineError: string | null;
  readonly isTunerActive: boolean;
  readonly isEffectRackOpen: boolean;
  readonly handleStartEngine: () => Promise<void>;
  readonly handleStopEngine: () => Promise<void>;
  readonly openEffectRack: () => void;
  readonly closeEffectRack: () => void;
}

/**
 * Page-level hook of the pedalboard page: owns the audio engine's lifecycle and
 * the page's local UI state.
 * @returns Status flags and handlers for the page to pass to its components
 */
export function usePedalboardPage(): PedalboardPageState {
  const [isEffectRackOpen, setIsEffectRackOpen] = useState(false);

  const { isEngineRunning, isEngineStarting, engineError, startEngine, stopEngine } = useAudioEngine();
  const isTunerActive = useAudioStore((state) => state.isTunerActive);

  const openEffectRack = useCallback(() => {
    setIsEffectRackOpen(true);
  }, []);

  const closeEffectRack = useCallback(() => {
    setIsEffectRackOpen(false);
  }, []);

  return {
    isEngineRunning,
    isEngineStarting,
    engineError,
    isTunerActive,
    isEffectRackOpen,
    handleStartEngine: startEngine,
    handleStopEngine: stopEngine,
    openEffectRack,
    closeEffectRack,
  };
}
