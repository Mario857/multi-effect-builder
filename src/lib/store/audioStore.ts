import { create } from 'zustand';
import {
  MASTER_VOLUME_DEFAULT,
  MASTER_VOLUME_MAX,
  MASTER_VOLUME_MIN,
} from '@/lib/constants/audio';
import { clamp } from '@/lib/helpers/clamp';

interface AudioState {
  isEngineRunning: boolean;
  // True from the start request until the engine is running or the start has failed
  isEngineStarting: boolean;
  // Message of the last failed start or input switch; cleared by the next successful one
  engineError: string | null;
  // When false the output is muted at the speakers while the meters keep running
  isMonitoring: boolean;
  masterVolume: number;
  inputDeviceId: string;
  isTunerActive: boolean;
  availableDevices: readonly MediaDeviceInfo[];
}

interface AudioActions {
  setEngineRunning: (running: boolean) => void;
  setEngineStarting: (starting: boolean) => void;
  setEngineError: (error: string | null) => void;
  setMonitoring: (monitoring: boolean) => void;
  setMasterVolume: (volume: number) => void;
  setInputDeviceId: (deviceId: string) => void;
  setTunerActive: (active: boolean) => void;
  setAvailableDevices: (devices: readonly MediaDeviceInfo[]) => void;
}

/**
 * Engine status and the user's audio settings (volume, monitoring, input device, tuner).
 * The engine controller reads the settings from here and writes the status back;
 * components only read status and change settings. Fast-changing meter levels
 * are kept in `useMeterStore` so they do not re-render consumers of this store.
 */
export const useAudioStore = create<AudioState & AudioActions>()((set) => ({
  isEngineRunning: false,
  isEngineStarting: false,
  engineError: null,
  isMonitoring: true,
  masterVolume: MASTER_VOLUME_DEFAULT,
  inputDeviceId: '',
  isTunerActive: false,
  availableDevices: [],

  setEngineRunning: (running) => set({ isEngineRunning: running }),
  setEngineStarting: (starting) => set({ isEngineStarting: starting }),
  setEngineError: (error) => set({ engineError: error }),
  setMonitoring: (monitoring) => set({ isMonitoring: monitoring }),
  setMasterVolume: (volume) =>
    set({ masterVolume: clamp(volume, MASTER_VOLUME_MIN, MASTER_VOLUME_MAX) }),
  setInputDeviceId: (deviceId) => set({ inputDeviceId: deviceId }),
  setTunerActive: (active) => set({ isTunerActive: active }),
  setAvailableDevices: (devices) => set({ availableDevices: devices }),
}));
