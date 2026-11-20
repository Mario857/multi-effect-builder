'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { KEYBOARD_KEY } from '@/lib/constants/ui';
import { isSameSignalPath } from '@/lib/helpers/isSameSignalPath';
import { usePedalboardStore } from '@/lib/store/pedalboardStore';

// Appended to the name of the active preset once the board no longer matches it
const MODIFIED_MARKER = ' *';

/** One preset as shown in the preset list. */
export interface PresetItem {
  readonly id: string;
  /** The preset's name, marked when the board has been edited since the preset was loaded. */
  readonly label: string;
  readonly loadAriaLabel: string;
  readonly deleteAriaLabel: string;
  /** True for the preset the board was last loaded from or saved as. */
  readonly isActive: boolean;
  /** `solid` while the board still matches the active preset, `soft` once it has been edited. */
  readonly chipVariant: 'solid' | 'soft';
  /** Factory presets cannot be deleted. */
  readonly canDelete: boolean;
  readonly handleLoad: () => void;
  readonly handleDelete: () => void;
}

/** State and handlers of the preset manager. */
export interface PresetManagerState {
  readonly presetItems: readonly PresetItem[];
  /** True while the "save as preset" form is open. */
  readonly isNaming: boolean;
  readonly presetName: string;
  readonly canSave: boolean;
  readonly nameInputRef: React.RefObject<HTMLInputElement | null>;
  readonly startNamingButtonRef: React.RefObject<HTMLButtonElement | null>;
  readonly handleStartNaming: () => void;
  readonly handleCancelNaming: () => void;
  readonly handleNameChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  readonly handleNameKeyDown: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  readonly handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

/**
 * State of the preset manager: the preset list and the "save as preset" form.
 * @returns The presets to list and the form's state and handlers
 */
export function usePresetManager(): PresetManagerState {
  const { presets, activePresetId, savePreset, loadPreset, deletePreset } = usePedalboardStore(
    useShallow((state) => ({
      presets: state.presets,
      activePresetId: state.activePresetId,
      savePreset: state.savePreset,
      loadPreset: state.loadPreset,
      deletePreset: state.deletePreset,
    })),
  );

  // The store keeps `activePresetId` while the board is edited. Without this check the chip
  // of a preset would stay highlighted as if the board still sounded like it — and pressing
  // it, which looks like a no-op, would silently discard the edits.
  const isBoardModified = usePedalboardStore((state) => {
    const activePreset = state.presets.find((preset) => preset.id === state.activePresetId);
    return activePreset !== undefined && !isSameSignalPath(state, activePreset.pedalboard);
  });

  const [isNaming, setIsNaming] = useState(false);
  const [presetName, setPresetName] = useState('');

  const nameInputRef = useRef<HTMLInputElement>(null);
  const startNamingButtonRef = useRef<HTMLButtonElement>(null);
  // False until the form has been opened once, so that the first render does not steal the focus
  const hasOpenedFormRef = useRef(false);

  // The form and the button that opens it replace each other, which would leave the
  // keyboard focus on nothing: move it into the form when it opens and back onto the
  // button when it closes.
  useEffect(() => {
    if (isNaming) {
      nameInputRef.current?.focus();
      return;
    }
    if (hasOpenedFormRef.current) startNamingButtonRef.current?.focus();
  }, [isNaming]);

  const presetItems = useMemo(
    () =>
      presets.map((preset): PresetItem => {
        const isActive = preset.id === activePresetId;
        const isModified = isActive && isBoardModified;
        return {
          id: preset.id,
          label: isModified ? `${preset.name}${MODIFIED_MARKER}` : preset.name,
          loadAriaLabel: isModified
            ? `Reload preset: ${preset.name} (discards the changes made since it was loaded)`
            : `Load preset: ${preset.name}`,
          deleteAriaLabel: `Delete preset: ${preset.name}`,
          isActive,
          chipVariant: isModified ? 'soft' : 'solid',
          canDelete: !preset.isFactory,
          handleLoad: () => {
            loadPreset(preset.id);
          },
          handleDelete: () => {
            deletePreset(preset.id);
          },
        };
      }),
    [presets, activePresetId, isBoardModified, loadPreset, deletePreset],
  );

  const trimmedName = presetName.trim();
  const canSave = trimmedName !== '';

  const closeForm = () => {
    setPresetName('');
    setIsNaming(false);
  };

  const handleStartNaming = () => {
    hasOpenedFormRef.current = true;
    setIsNaming(true);
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPresetName(event.target.value);
  };

  const handleNameKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === KEYBOARD_KEY.ESCAPE) closeForm();
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    // The form is only used for its Enter-to-submit behaviour; there is nothing to post
    event.preventDefault();
    if (!canSave) return;
    savePreset(trimmedName);
    closeForm();
  };

  return {
    presetItems,
    isNaming,
    presetName,
    canSave,
    nameInputRef,
    startNamingButtonRef,
    handleStartNaming,
    handleCancelNaming: closeForm,
    handleNameChange,
    handleNameKeyDown,
    handleSubmit,
  };
}
