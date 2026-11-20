import { AudioEngine } from '@/lib/audio/engine';
import {
  ENGINE_ERROR_FALLBACK,
  ENGINE_ERROR_INSECURE_CONTEXT,
  INPUT_ERROR_MESSAGES,
  METER_UPDATE_INTERVAL_MS,
} from '@/lib/constants/audio';
import { isRecord } from '@/lib/helpers/isRecord';
import { useAudioStore } from '@/lib/store/audioStore';
import { useMeterStore } from '@/lib/store/meterStore';
import { usePedalboardStore } from '@/lib/store/pedalboardStore';

/*
 * Owns the page's single AudioEngine and connects it to the stores.
 *
 * The stores are the source of truth; while an engine exists this module pushes
 * their state into the audio graph through plain store subscriptions. Nothing
 * here runs inside React's render cycle, so moving a knob updates the audio
 * without re-rendering any component that is not displaying that knob.
 */

// The engine that is starting or running. Assigned synchronously when a start is
// requested, which is what makes a second start request (double click) a no-op.
let activeEngine: AudioEngine | null = null;

// Undoes attachStores() for the active engine
let detachStores: (() => void) | null = null;

function describeError(error: unknown): string {
  if (!isRecord(error)) return ENGINE_ERROR_FALLBACK;

  const knownMessage = typeof error.name === 'string' ? INPUT_ERROR_MESSAGES[error.name] : undefined;
  if (knownMessage) return knownMessage;
  return typeof error.message === 'string' && error.message !== '' ? error.message : ENGINE_ERROR_FALLBACK;
}

/**
 * Connects an input device and reports the outcome to the audio store.
 * Never rejects — a failure ends up in `engineError`.
 */
async function switchInput(engine: AudioEngine, deviceId: string | undefined): Promise<void> {
  try {
    const isConnected = await engine.connectInput(deviceId);
    // Superseded by a newer request, which will report its own outcome
    if (!isConnected || activeEngine !== engine) return;
    useAudioStore.getState().setEngineError(null);
  } catch (error) {
    if (activeEngine !== engine) return;
    useAudioStore.getState().setEngineError(describeError(error));
  }

  // Show the device that is really connected: after a fallback to the default input
  // or a failed switch it is not the one that was asked for
  const connectedDeviceId = engine.inputDeviceId;
  const { inputDeviceId, setInputDeviceId } = useAudioStore.getState();
  if (connectedDeviceId !== null && connectedDeviceId !== inputDeviceId) {
    setInputDeviceId(connectedDeviceId);
  }
}

async function refreshInputDevices(engine: AudioEngine): Promise<void> {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    if (activeEngine !== engine) return;
    useAudioStore.getState().setAvailableDevices(devices.filter((device) => device.kind === 'audioinput'));
  } catch {
    // Enumeration failed — keep showing the previous list
  }
}

async function handleDevicesChanged(engine: AudioEngine): Promise<void> {
  await refreshInputDevices(engine);
  if (activeEngine !== engine) return;

  // Read the selection now, after the await — it may have changed while enumerating
  const { availableDevices, inputDeviceId } = useAudioStore.getState();
  const isSelectedDeviceAvailable = availableDevices.some((device) => device.deviceId === inputDeviceId);

  // The selected interface was unplugged — fall back to the system default input
  if (!isSelectedDeviceAvailable || !engine.hasLiveInput) {
    await switchInput(engine, undefined);
  }
}

/**
 * Applies the current store state to the engine and keeps it applied until the
 * returned function is called.
 */
function attachStores(engine: AudioEngine): () => void {
  const { masterVolume, isMonitoring } = useAudioStore.getState();
  engine.setMasterVolume(masterVolume);
  engine.setMonitoring(isMonitoring);
  engine.syncPedalboard(usePedalboardStore.getState());

  const unsubscribePedalboard = usePedalboardStore.subscribe((state) => {
    engine.syncPedalboard(state);
  });

  const unsubscribeAudio = useAudioStore.subscribe((state, previous) => {
    if (state.masterVolume !== previous.masterVolume) engine.setMasterVolume(state.masterVolume);
    if (state.isMonitoring !== previous.isMonitoring) engine.setMonitoring(state.isMonitoring);

    // No reconnect when the store merely caught up with the device the engine already uses
    const hasSelectionChanged = state.inputDeviceId !== previous.inputDeviceId;
    if (hasSelectionChanged && state.inputDeviceId !== engine.inputDeviceId) {
      void switchInput(engine, state.inputDeviceId);
    }
  });

  const meterTimer = setInterval(() => {
    // Nobody can see the meters of a hidden tab
    if (document.hidden) return;
    useMeterStore.getState().setLevels(engine.getInputLevel(), engine.getOutputLevel());
  }, METER_UPDATE_INTERVAL_MS);

  // Listen for device changes (plugging/unplugging interfaces)
  const handleDeviceChange = () => {
    void handleDevicesChanged(engine);
  };
  navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);

  return () => {
    unsubscribePedalboard();
    unsubscribeAudio();
    clearInterval(meterTimer);
    navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    useMeterStore.getState().setLevels(0, 0);
  };
}

/**
 * Starts the audio engine: creates the AudioContext, loads the worklets and cab
 * IRs, builds the graph from the pedalboard store and connects the selected input.
 *
 * Progress and failure are reported through the audio store (`isEngineStarting`,
 * `isEngineRunning`, `engineError`); the returned promise never rejects. Calling
 * this while an engine is already starting or running does nothing.
 */
export async function startAudioEngine(): Promise<void> {
  if (activeEngine !== null) return;

  const { setEngineStarting, setEngineRunning, setEngineError } = useAudioStore.getState();

  // getUserMedia and AudioWorklet only exist on HTTPS/localhost pages
  if (!window.isSecureContext) {
    setEngineError(ENGINE_ERROR_INSECURE_CONTEXT);
    return;
  }

  const engine: AudioEngine = new AudioEngine(() => {
    // The connected device stopped delivering audio (unplugged) — fall back to the default input
    void switchInput(engine, undefined);
  });
  activeEngine = engine;
  setEngineError(null);
  setEngineStarting(true);

  try {
    await engine.start();
    // stopAudioEngine() ran while the modules were loading and has already cleaned up
    if (activeEngine !== engine) return;

    // Attach before asking for the microphone: the permission prompt can stay open
    // for a long time and board changes made meanwhile must not be lost
    detachStores = attachStores(engine);

    await engine.connectInput(useAudioStore.getState().inputDeviceId);
    if (activeEngine !== engine) return;
  } catch (error) {
    // A late failure of an engine that was stopped meanwhile is not worth reporting
    if (activeEngine !== engine) return;

    activeEngine = null;
    detachStores?.();
    detachStores = null;
    setEngineStarting(false);
    setEngineError(describeError(error));
    await engine.stop();
    return;
  }

  // Adopt the device that was actually opened (the stored one may have fallen back to the default)
  const connectedDeviceId = engine.inputDeviceId;
  if (connectedDeviceId !== null) useAudioStore.getState().setInputDeviceId(connectedDeviceId);

  setEngineStarting(false);
  setEngineRunning(true);

  // getUserMedia must be called before enumerating so browsers expose device labels
  await refreshInputDevices(engine);
}

/**
 * Stops the audio engine: releases the microphone, disposes the audio graph and
 * closes the AudioContext. Safe to call at any time, including during a start.
 */
export async function stopAudioEngine(): Promise<void> {
  const engine = activeEngine;
  if (engine === null) return;

  activeEngine = null;
  detachStores?.();
  detachStores = null;

  const { setEngineStarting, setEngineRunning, setEngineError } = useAudioStore.getState();
  setEngineStarting(false);
  setEngineRunning(false);
  // An input-switch error of the engine that is going away is no longer relevant
  setEngineError(null);

  await engine.stop();
}

/**
 * The analyser on the dry input signal of the running engine.
 * @returns The analyser, or null when no engine is running
 */
export function getInputAnalyser(): AnalyserNode | null {
  return activeEngine?.getInputAnalyser() ?? null;
}
