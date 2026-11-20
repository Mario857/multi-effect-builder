'use client';

import { useMemo } from 'react';
import { useAudioInput } from '@/hooks/useAudioInput';
import { DEVICE_ID_LABEL_LENGTH } from '@/lib/constants/ui';

/** One audio input as an option of the device picker. */
export interface InputDeviceOption {
  readonly value: string;
  readonly label: string;
}

/** State and handlers of the audio input picker. */
export interface InputDeviceSelectState {
  readonly options: readonly InputDeviceOption[];
  readonly selectedValue: string;
  /** False until the engine has started once: browsers do not list inputs before microphone access. */
  readonly hasDevices: boolean;
  readonly handleChange: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}

/**
 * State of the audio input picker.
 * @returns The selectable inputs, the current selection and its change handler
 */
export function useInputDeviceSelect(): InputDeviceSelectState {
  const { audioInputDevices, inputDeviceId, setInputDeviceId } = useAudioInput();

  const options = useMemo(
    () =>
      audioInputDevices.map((device) => ({
        value: device.deviceId,
        // Labels are empty when the browser withholds them; fall back to the start of the id
        label: device.label || `Input ${device.deviceId.slice(0, DEVICE_ID_LABEL_LENGTH)}`,
      })),
    [audioInputDevices],
  );

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setInputDeviceId(event.target.value);
  };

  return {
    options,
    selectedValue: inputDeviceId,
    hasDevices: options.length > 0,
    handleChange,
  };
}
