'use client';

import { Save, Trash2, FolderOpen } from 'lucide-react';
import { useState } from 'react';
import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import { Button } from '@/components/shared/Button';
import { IconButton } from '@/components/shared/IconButton';
import { usePedalboardStore } from '@/lib/store/pedalboardStore';

const MAX_PRESET_NAME_LENGTH = 30;

export function PresetManager() {
  const { presets, activePresetId, savePreset, loadPreset, deletePreset } = usePedalboardStore();
  const [isNaming, setIsNaming] = useState(false);
  const [presetName, setPresetName] = useState('');

  const handleSave = () => {
    if (!presetName.trim()) return;
    savePreset(presetName.trim());
    setPresetName('');
    setIsNaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setIsNaming(false);
  };

  const saveForm = isNaming ? (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={presetName}
        onChange={(e) => setPresetName(e.target.value.slice(0, MAX_PRESET_NAME_LENGTH))}
        onKeyDown={handleKeyDown}
        placeholder="Preset name..."
        autoFocus
        aria-label="Preset name"
        className={mergeClassNames(
          'rounded-md px-2 py-1',
          'bg-bg-elevated border border-border-default',
          'text-xs text-text-primary',
          'placeholder:text-text-muted',
          'focus-visible:outline-2 focus-visible:outline-accent-primary',
        )}
      />
      <Button size="sm" onClick={handleSave} aria-label="Save preset">
        Save
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setIsNaming(false)} aria-label="Cancel">
        Cancel
      </Button>
    </div>
  ) : (
    <Button size="sm" variant="secondary" onClick={() => setIsNaming(true)} aria-label="Save current chain as preset">
      <Save className="h-3.5 w-3.5" />
      Save Preset
    </Button>
  );

  const hasPresets = presets.length > 0;

  const presetList = hasPresets ? (
    <div className="flex flex-wrap gap-1.5">
      {presets.map((preset) => {
        const isActive = preset.id === activePresetId;
        return (
          <div key={preset.id} className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => loadPreset(preset.id)}
              aria-label={`Load preset: ${preset.name}`}
              className={mergeClassNames(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1',
                'text-xs font-medium',
                'transition-all duration-150 ease-out',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-primary',
                isActive
                  ? 'bg-accent-primary text-text-inverse'
                  : 'bg-bg-elevated text-text-secondary hover:text-text-primary',
              )}
            >
              <FolderOpen className="h-3 w-3" />
              {preset.name}
            </button>
            {!preset.isFactory && (
              <IconButton
                aria-label={`Delete preset: ${preset.name}`}
                size="sm"
                onClick={() => deletePreset(preset.id)}
              >
                <Trash2 className="h-3 w-3" />
              </IconButton>
            )}
          </div>
        );
      })}
    </div>
  ) : (
    <span className="text-xs text-text-muted">No saved presets</span>
  );

  return (
    <div
      className={mergeClassNames(
        'flex flex-col gap-3 rounded-xl border border-border-default p-4',
        'bg-bg-surface',
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
          Presets
        </span>
        {saveForm}
      </div>
      {presetList}
    </div>
  );
}
