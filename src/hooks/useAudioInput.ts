'use client';

import { useShallow } from 'zustand/react/shallow';
import { useAudioStore } from '@/lib/store/audioStore';

/** The available audio inputs and the current selection. */
export interface AudioInputSelection {
  /** Empty until the engine has started once — browsers hide devices before microphone access is granted. */
  readonly audioInputDevices: readonly MediaDeviceInfo[];
  readonly inputDeviceId: string;
  readonly setInputDeviceId: (deviceId: string) => void;
}

/**
 * Read-only view of the audio input devices for device pickers. Safe to call
 * from any number of components: the device list is kept up to date by the
 * engine controller (one `devicechange` listener for the whole app), and
 * selecting a device makes the running engine switch to it.
 * @returns The device list, the selected device id and its setter
 */
export function useAudioInput(): AudioInputSelection {
  return useAudioStore(
    useShallow((state) => ({
      audioInputDevices: state.availableDevices,
      inputDeviceId: state.inputDeviceId,
      setInputDeviceId: state.setInputDeviceId,
    })),
  );
}
