import { create } from 'zustand';
import { MASTER_VOLUME_DEFAULT } from '@/lib/constants/audio';

interface AudioState {
  isEngineRunning: boolean;
  isMonitoring: boolean;
  masterVolume: number;
  inputDeviceId: string;
  inputLevel: number;
  outputLevel: number;
  isTunerActive: boolean;
  availableDevices: readonly MediaDeviceInfo[];
}

interface AudioActions {
  setEngineRunning: (running: boolean) => void;
  setMonitoring: (monitoring: boolean) => void;
  setMasterVolume: (volume: number) => void;
  setInputDeviceId: (deviceId: string) => void;
  setInputLevel: (level: number) => void;
  setOutputLevel: (level: number) => void;
  setTunerActive: (active: boolean) => void;
  setAvailableDevices: (devices: readonly MediaDeviceInfo[]) => void;
}

export const useAudioStore = create<AudioState & AudioActions>()((set) => ({
  isEngineRunning: false,
  isMonitoring: false,
  masterVolume: MASTER_VOLUME_DEFAULT,
  inputDeviceId: '',
  inputLevel: 0,
  outputLevel: 0,
  isTunerActive: false,
  availableDevices: [],

  setEngineRunning: (running) => set({ isEngineRunning: running }),
  setMonitoring: (monitoring) => set({ isMonitoring: monitoring }),
  setMasterVolume: (volume) => set({ masterVolume: volume }),
  setInputDeviceId: (deviceId) => set({ inputDeviceId: deviceId }),
  setInputLevel: (level) => set({ inputLevel: level }),
  setOutputLevel: (level) => set({ outputLevel: level }),
  setTunerActive: (active) => set({ isTunerActive: active }),
  setAvailableDevices: (devices) => set({ availableDevices: devices }),
}));
