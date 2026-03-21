'use client';

import { useEffect, useCallback } from 'react';
import { useAudioStore } from '@/lib/store/audioStore';

export function useAudioInput() {
  const {
    availableDevices,
    inputDeviceId,
    setAvailableDevices,
    setInputDeviceId,
  } = useAudioStore();

  const enumerateDevices = useCallback(async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter((d) => d.kind === 'audioinput');
    setAvailableDevices(audioInputs);

    // Auto-select first device if none selected
    if (!inputDeviceId && audioInputs.length > 0) {
      setInputDeviceId(audioInputs[0].deviceId);
    }
  }, [inputDeviceId, setAvailableDevices, setInputDeviceId]);

  // Listen for device changes (plugging/unplugging interfaces)
  useEffect(() => {
    const handleDeviceChange = () => {
      enumerateDevices();
    };

    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
    };
  }, [enumerateDevices]);

  const audioInputDevices = availableDevices.filter((d) => d.kind === 'audioinput');

  return {
    audioInputDevices,
    inputDeviceId,
    setInputDeviceId,
    enumerateDevices,
  };
}
