import React, { useState } from 'react';
import { VisualizerPreset, VisualizerSettings } from '../types/visualizer';
import { presetService } from '../services/presetService';
import { Bookmark, Star, Plus, Trash2, Check, Download, Upload, Sparkles } from 'lucide-react';

interface PresetSelectorBarProps {
  currentSettings: VisualizerSettings;
  activePresetId?: string;
  onApplyPreset: (preset: VisualizerPreset) => void;
  onOpenPresetModal: () => void;
}

export const PresetSelectorBar: React.FC<PresetSelectorBarProps> = ({
  currentSettings,
  activePresetId,
  onApplyPreset,
  onOpenPresetModal
}) => {
  const [presets, setPresets] = useState<VisualizerPreset[]>(presetService.getAll());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [newPresetName, setNewPresetName] = useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const refreshPresets = () => {
    setPresets(presetService.getAll());
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;

    const saved = presetService.savePreset(newPresetName, currentSettings);
    refreshPresets();
    onApplyPreset(saved);
    setNewPresetName('');
    setIsSaving(false);
    showFeedback(`Preset "${saved.name}" saved!`);
  };

  const handleToggleStar = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    presetService.toggleFavorite(id);
    refreshPresets();
  };

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (confirm(`Delete preset "${name}"?`)) {
      presetService.deletePreset(id);
      refreshPresets();
      showFeedback(`Preset removed`);
    }
  };

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 2500);
  };

  return (
    <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bookmark className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
            Visualizer Presets
          </span>
          <span className="text-xs text-neutral-400">· Click to switch settings instantly</span>
        </div>

        <div className="flex items-center gap-2">
          {feedbackMsg && (
            <span className="text-xs text-amber-400 flex items-center gap-1 font-medium animate-fade-in mr-2">
              <Check className="w-3 h-3" />
              {feedbackMsg}
            </span>
          )}

          <button
            onClick={() => setIsSaving(true)}
            className="px-2.5 py-1 text-xs text-neutral-950 bg-amber-400 hover:bg-amber-300 font-semibold rounded-md flex items-center gap-1 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save Current</span>
          </button>

          <button
            onClick={onOpenPresetModal}
            className="px-2.5 py-1 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-md border border-neutral-700 transition-colors flex items-center gap-1"
            title="Import or Export presets"
          >
            <Upload className="w-3 h-3" />
            <span>Import / Export</span>
          </button>
        </div>
      </div>

      {/* Save Modal Inline Input */}
      {isSaving && (
        <form onSubmit={handleSavePreset} className="flex items-center gap-2 bg-neutral-950 p-2.5 rounded-lg border border-neutral-700">
          <input
            type="text"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="Enter preset name (e.g., Midnight Gold Drive)..."
            autoFocus
            className="flex-1 bg-transparent border-none text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newPresetName.trim()}
            className="px-3 py-1 bg-amber-400 text-neutral-950 text-xs font-semibold rounded disabled:opacity-40"
          >
            Save Preset
          </button>
          <button
            type="button"
            onClick={() => setIsSaving(false)}
            className="px-2 py-1 text-xs text-neutral-400 hover:text-neutral-200"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Horizontal Preset Carousel / Grid */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs select-none">
        {presets.map((preset) => {
          const isActive = activePresetId === preset.id;
          const stops = preset.settings.customStops || [];
          const grad = `linear-gradient(to right, ${stops.map(s => `${s.color} ${(s.position * 100).toFixed(0)}%`).join(', ')})`;

          return (
            <button
              key={preset.id}
              onClick={() => onApplyPreset(preset)}
              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg border shrink-0 transition-all text-left ${
                isActive
                  ? 'bg-neutral-800 border-amber-500/80 ring-1 ring-amber-500/30 text-neutral-100'
                  : 'bg-neutral-950/70 border-neutral-800/80 hover:bg-neutral-800/60 hover:border-neutral-700 text-neutral-300'
              }`}
            >
              {/* Mini palette swatch */}
              <div
                className="w-3.5 h-3.5 rounded-full border border-neutral-700 shrink-0 shadow-sm"
                style={{ background: grad }}
              />

              <div className="flex flex-col">
                <span className="font-medium text-xs truncate max-w-[140px]">
                  {preset.name}
                </span>
                <span className="text-[10px] text-neutral-400 capitalize">
                  {preset.settings.mode.replace('-', ' ')}
                </span>
              </div>

              {/* Favorite Star */}
              <div
                onClick={(e) => handleToggleStar(e, preset.id)}
                className={`p-0.5 hover:text-amber-400 transition-colors ml-1 ${
                  preset.isFavorite ? 'text-amber-400' : 'text-neutral-600'
                }`}
                title="Mark as Favorite"
              >
                <Star className={`w-3 h-3 ${preset.isFavorite ? 'fill-current' : ''}`} />
              </div>

              {/* Delete (only for user-created presets) */}
              {!preset.id.startsWith('preset-aimp') && !preset.id.startsWith('preset-cyber') && !preset.id.startsWith('preset-synth') && (
                <div
                  onClick={(e) => handleDelete(e, preset.id, preset.name)}
                  className="p-0.5 text-neutral-600 hover:text-red-400 transition-colors"
                  title="Delete preset"
                >
                  <Trash2 className="w-3 h-3" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
