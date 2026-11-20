'use client';

import { FolderOpen, Save, Trash2 } from 'lucide-react';
import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import { Button } from '@/components/shared/Button';
import { Card } from '@/components/shared/Card';
import { ChipButton } from '@/components/shared/ChipButton';
import { IconButton } from '@/components/shared/IconButton';
import { FIELD_CLASSES, FOCUS_RING_CLASSES, PRESET_NAME_MAX_LENGTH } from '@/lib/constants/ui';
import { usePresetManager } from '@/hooks/usePresetManager';

/**
 * Preset section: loads and deletes presets and saves the current board as a new one.
 * The chip of the active preset is filled while the board still matches it and only
 * tinted, with a `*` after its name, once the board has been edited.
 */
export function PresetManager() {
  const {
    presetItems,
    isNaming,
    presetName,
    canSave,
    nameInputRef,
    startNamingButtonRef,
    handleStartNaming,
    handleCancelNaming,
    handleNameChange,
    handleNameKeyDown,
    handleSubmit,
  } = usePresetManager();

  const saveForm = isNaming ? (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        ref={nameInputRef}
        type="text"
        value={presetName}
        maxLength={PRESET_NAME_MAX_LENGTH}
        onChange={handleNameChange}
        onKeyDown={handleNameKeyDown}
        placeholder="Preset name..."
        aria-label="Preset name"
        className={mergeClassNames(FIELD_CLASSES, 'placeholder:text-text-muted', FOCUS_RING_CLASSES)}
      />
      <Button type="submit" size="sm" disabled={!canSave} aria-label="Save preset">
        Save
      </Button>
      <Button size="sm" variant="ghost" onClick={handleCancelNaming} aria-label="Cancel saving preset">
        Cancel
      </Button>
    </form>
  ) : (
    <Button
      ref={startNamingButtonRef}
      size="sm"
      variant="secondary"
      onClick={handleStartNaming}
      aria-label="Save preset: save the current chain as a preset"
    >
      <Save className="h-3.5 w-3.5" />
      Save Preset
    </Button>
  );

  const presetChips = presetItems.map((item) => {
    const deleteButton = item.canDelete ? (
      <IconButton aria-label={item.deleteAriaLabel} size="sm" onClick={item.handleDelete}>
        <Trash2 />
      </IconButton>
    ) : null;

    return (
      <div key={item.id} className="flex items-center gap-0.5">
        <ChipButton
          isActive={item.isActive}
          variant={item.chipVariant}
          icon={<FolderOpen />}
          onClick={item.handleLoad}
          aria-label={item.loadAriaLabel}
        >
          {item.label}
        </ChipButton>
        {deleteButton}
      </div>
    );
  });

  return (
    <Card variant="glass" padding="md" title="Presets" action={saveForm}>
      <div className="flex flex-wrap gap-1.5">{presetChips}</div>
    </Card>
  );
}
