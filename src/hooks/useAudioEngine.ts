'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { AudioEngine } from '@/lib/audio/engine';
import { createEffectNode } from '@/lib/audio/effectFactory';
import { useAudioStore } from '@/lib/store/audioStore';
import { usePedalboardStore } from '@/lib/store/pedalboardStore';
import { METER_UPDATE_INTERVAL_MS } from '@/lib/constants/audio';
import type { EffectNode } from '@/lib/audio/effectNode';

export function useAudioEngine() {
  const engineRef = useRef<AudioEngine | null>(null);
  const ampNodeRef = useRef<EffectNode | null>(null);
  const effectNodesRef = useRef<EffectNode[]>([]);

  const {
    isEngineRunning,
    masterVolume,
    inputDeviceId,
    setEngineRunning,
    setInputLevel,
    setOutputLevel,
  } = useAudioStore();

  const { ampType, ampParameters, effects } = usePedalboardStore();

  // Structural fingerprint — changes only when effects are added/removed/reordered/toggled
  const effectStructureKey = useMemo(
    () => effects.map(e => `${e.id}:${e.type}:${e.isBypassed}`).join('|'),
    [effects],
  );

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
    ampNodeRef.current = null;
    effectNodesRef.current = [];
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

  // Create amp node — only when amp type changes or engine starts
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine?.isRunning || !engine.audioContext || !engine.ampSignalChain) return;

    engine.ampSignalChain.clear();
    const ampNode = createEffectNode(engine.audioContext, ampType);
    const params = usePedalboardStore.getState().ampParameters;
    ampNode.setParameters(params);
    engine.ampSignalChain.addNode(ampNode);
    ampNodeRef.current = ampNode;
  }, [ampType, isEngineRunning]);

  // Update amp parameters in-place — no node recreation
  useEffect(() => {
    ampNodeRef.current?.setParameters(ampParameters);
  }, [ampParameters]);

  // Create effect nodes — only when structure changes or engine starts
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine?.isRunning || !engine.audioContext || !engine.effectSignalChain) return;

    const currentEffects = usePedalboardStore.getState().effects;
    engine.effectSignalChain.clear();
    const nodes: EffectNode[] = [];
    for (const effect of currentEffects) {
      const node = createEffectNode(engine.audioContext, effect.type);
      node.isBypassed = effect.isBypassed;
      node.setParameters(effect.parameters);
      engine.effectSignalChain.addNode(node);
      nodes.push(node);
    }
    effectNodesRef.current = nodes;
  }, [effectStructureKey, isEngineRunning]);

  // Update effect parameters in-place — no node recreation
  useEffect(() => {
    const nodes = effectNodesRef.current;
    if (nodes.length !== effects.length) return;
    for (let i = 0; i < effects.length; i++) {
      nodes[i].setParameters(effects[i].parameters);
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
