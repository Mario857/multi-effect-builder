'use client';

import { Mic } from 'lucide-react';
import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import { DISABLED_CLASSES, FIELD_CLASSES, FOCUS_RING_CLASSES } from '@/lib/constants/ui';
import { useInputDeviceSelect } from '@/hooks/useInputDeviceSelect';

/**
 * Picker for the audio input the engine listens to. Browsers only list the inputs once
 * microphone access has been granted, so until the engine has started once the picker
 * is disabled and says so.
 */
export function InputDeviceSelect() {
  const { options, selectedValue, hasDevices, handleChange } = useInputDeviceSelect();

  const deviceOptions = hasDevices ? (
    options.map((option) => (
      <option key={option.value} value={option.value}>
        {option.label}
      </option>
    ))
  ) : (
    <option value={selectedValue}>Start audio to list inputs</option>
  );

  return (
    <div className="flex items-center gap-2">
      <Mic className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
      <select
        value={selectedValue}
        onChange={handleChange}
        disabled={!hasDevices}
        aria-label="Audio input device"
        className={mergeClassNames('max-w-60 truncate', FIELD_CLASSES, FOCUS_RING_CLASSES, DISABLED_CLASSES)}
      >
        {deviceOptions}
      </select>
    </div>
  );
}
