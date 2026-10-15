import React, { useState } from 'react';
import { VisualizerSettings } from '../types/visualizer';
import { Download, Upload, X, Check } from 'lucide-react';

interface PresetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: VisualizerSettings;
  onLoadSettings: (loaded: VisualizerSettings) => void;
}

export const PresetManagerModal: React.FC<PresetManagerModalProps> = ({
  isOpen,
  onClose,
  settings,
  onLoadSettings
}) => {
  const [jsonText, setJsonText] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportJson = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aimp-visualizer-${settings.mode}-preset.aimpvis`;
    link.click();
    URL.revokeObjectURL(url);
    setStatusMsg('Preset file downloaded!');
    setTimeout(() => setStatusMsg(null), 2500);
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      if (parsed && parsed.mode && parsed.customStops) {
        onLoadSettings(parsed);
        setStatusMsg('Preset successfully loaded!');
        setTimeout(() => {
          setStatusMsg(null);
          onClose();
        }, 1200);
      } else {
        setStatusMsg('Invalid preset JSON structure');
      }
    } catch {
      setStatusMsg('Failed to parse JSON. Please check formatting.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setJsonText(text);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <h3 className="text-sm font-semibold text-neutral-100">
            AIMP Visualizer Preset Manager (.aimpvis)
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-neutral-400 leading-relaxed">
          Save your color stops, physics constants, and visualizer parameters to an external configuration file or paste JSON below.
        </p>

        <div className="space-y-2">
          <label className="text-xs font-medium text-neutral-300 block">
            Paste Preset JSON or Load File:
          </label>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder='{"mode": "classic-spectrum", "smoothing": 0.8, ...}'
            className="w-full h-32 bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 font-mono text-xs text-neutral-200 focus:outline-none focus:border-amber-500/50"
          />
        </div>

        {statusMsg && (
          <div className="text-xs text-amber-400 flex items-center gap-1.5 font-medium">
            <Check className="w-3.5 h-3.5" />
            <span>{statusMsg}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-3 pt-2 border-t border-neutral-800">
          <div className="flex items-center gap-2">
            <label className="px-3 py-1.5 text-xs text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 cursor-pointer flex items-center gap-1.5 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Open File</span>
              <input
                type="file"
                accept=".aimpvis,.json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 text-xs text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Preset</span>
            </button>
          </div>

          <button
            onClick={handleImportJson}
            disabled={!jsonText.trim()}
            className="px-4 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 disabled:hover:bg-amber-400 rounded-lg transition-colors"
          >
            Apply Preset
          </button>
        </div>
      </div>
    </div>
  );
};
