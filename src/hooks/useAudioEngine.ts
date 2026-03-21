'use client';

import { useEffect, useRef, useCallback } from 'react';
import { AudioEngine } from '@/lib/audio/engine';
import { createEffectNode } from '@/lib/audio/effectFactory';
import { useAudioStore } from '@/lib/store/audioStore';
import { usePedalboardStore } from '@/lib/store/pedalboardStore';
import { METER_UPDATE_INTERVAL_MS } from '@/lib/constants/audio';

export function useAudioEngine() {
  const engineRef = useRef<AudioEngine | null>(null);

  const {
    isEngineRunning,
    masterVolume,
    inputDeviceId,
    setEngineRunning,
    setInputLevel,
    setOutputLevel,
  } = useAudioStore();

  const { ampType, ampParameters, effects } = usePedalboardStore();

  const startEngine = useCallback(async () => {
    if (engineRef.current?.isRunning) return;

    const engine = new AudioEngine();
    engineRef.current = engine;
    await engine.start();
    setEngineRunning(true);
  }, [setEngineRunning]);

  const stopEngine = useCallback(async () => {
    if (!engineRef.current) return;
    await engineRef.current.stop();
    engineRef.current = null;
    setEngineRunning(false);
  }, [setEngineRunning]);

  const connectInput = useCallback(async (deviceId?: string) => {
    if (!engineRef.current) return;
    await engineRef.current.connectInput(deviceId);
  }, []);

  // Sync master volume
  useEffect(() => {
    engineRef.current?.setMasterVolume(masterVolume);
  }, [masterVolume]);

  // Sync input device
  useEffect(() => {
    if (!isEngineRunning || !inputDeviceId) return;
    engineRef.current?.connectInput(inputDeviceId);
  }, [inputDeviceId, isEngineRunning]);

  // Sync amp to audio engine
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine?.isRunning || !engine.audioContext || !engine.ampSignalChain) return;

    engine.ampSignalChain.clear();
    const ampNode = createEffectNode(engine.audioContext, ampType);
    ampNode.setParameters(ampParameters);
    engine.ampSignalChain.addNode(ampNode);
  }, [ampType, ampParameters]);

  // Sync effects to audio engine
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine?.isRunning || !engine.audioContext || !engine.effectSignalChain) return;

    engine.effectSignalChain.clear();
    for (const effect of effects) {
      const node = createEffectNode(engine.audioContext, effect.type);
      node.isBypassed = effect.isBypassed;
      node.setParameters(effect.parameters);
      engine.effectSignalChain.addNode(node);
    }
  }, [effects]);

  // Metering update loop
  useEffect(() => {
    if (!isEngineRunning) return;

    const interval = setInterval(() => {
      if (!engineRef.current) return;
      setInputLevel(engineRef.current.getInputLevel());
      setOutputLevel(engineRef.current.getOutputLevel());
    }, METER_UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isEngineRunning, setInputLevel, setOutputLevel]);

  return {
    isEngineRunning,
    startEngine,
    stopEngine,
    connectInput,
    engine: engineRef,
  };
}
