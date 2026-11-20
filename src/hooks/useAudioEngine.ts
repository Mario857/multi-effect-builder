'use client';

import { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { startAudioEngine, stopAudioEngine } from '@/lib/audio/engineController';
import { useAudioStore } from '@/lib/store/audioStore';

/** Engine status flags and the handlers that drive the engine's lifecycle. */
export interface AudioEngineControls {
  readonly isEngineRunning: boolean;
  /** True from the start request until the engine runs or the start has failed. */
  readonly isEngineStarting: boolean;
  /** Message of the last failed start or input switch, null when there is none. */
  readonly engineError: string | null;
  /** Never rejects — failures are reported through `engineError`. No-op while starting or running. */
  readonly startEngine: () => Promise<void>;
  /** Releases the microphone and closes the AudioContext. No-op when not running. */
  readonly stopEngine: () => Promise<void>;
}

/**
 * Binds the audio engine's lifecycle to the component that calls it: exposes
 * start/stop and the engine status, and stops the engine when that component
 * unmounts. Call it once, from the page-level hook.
 *
 * The engine itself and its synchronisation with the stores live outside React
 * (see engineController), so this hook only re-renders on status changes.
 * @returns Status flags and start/stop handlers
 */
export function useAudioEngine(): AudioEngineControls {
  const status = useAudioStore(
    useShallow((state) => ({
      isEngineRunning: state.isEngineRunning,
      isEngineStarting: state.isEngineStarting,
      engineError: state.engineError,
    })),
  );

  // Without this the AudioContext and the microphone would stay live after the
  // page unmounts (navigation, hot reload)
  useEffect(() => {
    return () => {
      void stopAudioEngine();
    };
  }, []);

  return {
    ...status,
    startEngine: startAudioEngine,
    stopEngine: stopAudioEngine,
  };
}
