'use client';

import { useState, useCallback } from 'react';
import { useAudioEngine } from '@/hooks/useAudioEngine';
import { useAudioInput } from '@/hooks/useAudioInput';
import { useTuner } from '@/hooks/useTuner';
import { useAudioStore } from '@/lib/store/audioStore';

export function usePedalboardPage() {
  const [isEffectRackOpen, setIsEffectRackOpen] = useState(false);

  const { isEngineRunning, startEngine, engine } = useAudioEngine();
  const { enumerateDevices } = useAudioInput();
  const { isTunerActive } = useAudioStore();

  const analyser = engine.current?.getInputAnalyser() ?? null;
  const { reading: tunerReading } = useTuner(analyser);

  const handleStartEngine = useCallback(async () => {
    await startEngine();
    await enumerateDevices();
  }, [startEngine, enumerateDevices]);

  const openEffectRack = useCallback(() => {
    setIsEffectRackOpen(true);
  }, []);

  const closeEffectRack = useCallback(() => {
    setIsEffectRackOpen(false);
  }, []);

  return {
    isEngineRunning,
    isTunerActive,
    isEffectRackOpen,
    tunerReading,
    handleStartEngine,
    openEffectRack,
    closeEffectRack,
  };
}
