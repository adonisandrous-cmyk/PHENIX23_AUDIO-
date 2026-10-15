import React, { useRef } from 'react';
import { ColorPalette, VisualizerSettings, BackgroundStyle } from '../types/visualizer';
import { PRESET_PALETTES } from '../services/paletteService';
import { extractPaletteFromAlbumArt } from '../services/autoPaletteService';
import { 
  Plus, 
  Trash2, 
  RotateCcw, 
  Sliders, 
  Sparkles, 
  Wand2, 
  Image as ImageIcon, 
  Radio, 
  Upload,
  Grid,
  Zap,
  Activity,
  Layers
} from 'lucide-react';

interface PaletteCustomizerProps {
  settings: VisualizerSettings;
  onUpdateSettings: (updater: (prev: VisualizerSettings) => VisualizerSettings) => void;
}

const SAMPLE_ALBUM_ARTS = [
  {
    name: 'Neon Cyber City',
    url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=300&q=80'
  },
  {
    name: 'Sunset Horizon',
    url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80'
  },
  {
    name: 'Deep Blue Nebula',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=300&q=80'
  }
];

const BACKGROUND_OPTIONS: { id: BackgroundStyle; name: string; desc: string; icon: React.ElementType }[] = [
  {
    id: 'deep-slate',
    name: 'Minimal Deep Slate',
    desc: 'Quiet dark studio surface with subtle audio breathing aura.',
    icon: Layers
  },
  {
    id: 'reactive-vignette-pulse',
    name: 'Reactive Vignette Pulse',
    desc: 'Radial glow that expands and breathes on kick drum & sub transients.',
    icon: Zap
  },
  {
    id: 'frequency-waterfall',
    name: 'Waterfall Spectrogram',
    desc: 'Cascading frequency history waterfall descending in palette hues.',
    icon: Activity
  },
  {
    id: 'cyber-grid-mesh',
    name: 'Cyber Grid Floor',
    desc: '3D perspective wireframe floor warping on low-end frequencies.',
    icon: Grid
  },
  {
    id: 'nebula-particle-drift',
    name: 'Nebula Particle Drift',
    desc: 'Floating dust motes and bokeh particles accelerating with treble.',
    icon: Sparkles
  },
  {
    id: 'audio-reactive-waves',
    name: 'Harmonic Sine Waves',
    desc: 'Smooth undulating gradient waves rippling horizontally across the frame.',
    icon: Radio
  }
];

export const PaletteCustomizer: React.FC<PaletteCustomizerProps> = ({
  settings,
  onUpdateSettings
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentPreset = PRESET_PALETTES.find(p => p.id === settings.paletteId) || PRESET_PALETTES[0];

  const handleSelectPreset = (palette: ColorPalette) => {
    onUpdateSettings(prev => ({
      ...prev,
      paletteId: palette.id,
      autoPaletteEnabled: false,
      customStops: palette.stops.map(s => ({ ...s }))
    }));
  };

  const handleUpdateStopColor = (id: string, color: string) => {
    onUpdateSettings(prev => ({
      ...prev,
      autoPaletteEnabled: false,
      customStops: prev.customStops.map(s => s.id === id ? { ...s, color } : s)
    }));
  };

  const handleUpdateStopPos = (id: string, pos: number) => {
    onUpdateSettings(prev => ({
      ...prev,
      autoPaletteEnabled: false,
      customStops: prev.customStops
        .map(s => s.id === id ? { ...s, position: Math.max(0, Math.min(1, pos)) } : s)
        .sort((a, b) => a.position - b.position)
    }));
  };

  const handleAddStop = () => {
    const stops = [...settings.customStops];
    const newId = 'stop-' + Date.now();
    const lastPos = stops.length > 0 ? stops[stops.length - 1].position : 0.5;
    const newPos = Math.min(1.0, lastPos + 0.1);
    stops.push({ id: newId, position: newPos, color: '#f59e0b' });
    stops.sort((a, b) => a.position - b.position);

    onUpdateSettings(prev => ({
      ...prev,
      autoPaletteEnabled: false,
      customStops: stops
    }));
  };

  const handleRemoveStop = (id: string) => {
    if (settings.customStops.length <= 2) return;
    onUpdateSettings(prev => ({
      ...prev,
      autoPaletteEnabled: false,
      customStops: prev.customStops.filter(s => s.id !== id)
    }));
  };

  const handleResetToPreset = () => {
    handleSelectPreset(currentPreset);
  };

  // Album art extraction
  const handleExtractFromArtwork = async (imageUrl: string) => {
    try {
      const stops = await extractPaletteFromAlbumArt(imageUrl);
      onUpdateSettings(prev => ({
        ...prev,
        autoPaletteEnabled: false,
        albumArtUrl: imageUrl,
        customStops: stops
      }));
    } catch (err) {
      console.error('Failed to extract album art colors:', err);
    }
  };

  const handleCustomImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      handleExtractFromArtwork(url);
    }
  };

  // Build CSS gradient string
  const gradientCss = `linear-gradient(to right, ${
    settings.customStops
      .slice()
      .sort((a, b) => a.position - b.position)
      .map(s => `${s.color} ${(s.position * 100).toFixed(1)}%`)
      .join(', ')
  })`;

  return (
    <div className="space-y-6">
      {/* Hidden file input for album art */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleCustomImageUpload}
        className="hidden"
      />

      {/* 1. Real-Time Auto-Palette Generator Feature */}
      <div className="bg-neutral-900/80 border border-amber-500/30 rounded-xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-400 text-neutral-950">
              <Wand2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
                <span>Real-Time Color Palette Generator</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Automatically generate palettes analyzing dominant frequencies, energy, or album art
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 text-xs text-neutral-200">
            <input
              type="checkbox"
              checked={settings.autoPaletteEnabled}
              onChange={(e) => onUpdateSettings(prev => ({ ...prev, autoPaletteEnabled: e.target.checked }))}
              className="rounded accent-amber-400"
            />
            <span className="font-medium">
              {settings.autoPaletteEnabled ? 'Auto-Palette Active' : 'Enable Auto-Palette'}
            </span>
          </label>
        </div>

        {/* Auto Palette Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Analysis Source Mode */}
          <div className="space-y-2">
            <span className="text-neutral-400 block font-medium">Generation Source:</span>
            <div className="flex items-center gap-2 p-1 bg-neutral-950 rounded-lg border border-neutral-800">
              <button
                onClick={() => onUpdateSettings(prev => ({ ...prev, autoPaletteSource: 'audio', autoPaletteEnabled: true }))}
                className={`flex-1 py-1.5 rounded text-xs transition-colors flex items-center justify-center gap-1.5 ${
                  settings.autoPaletteSource === 'audio'
                    ? 'bg-neutral-800 text-amber-400 font-medium shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Audio Frequencies (Real-Time)</span>
              </button>
              <button
                onClick={() => onUpdateSettings(prev => ({ ...prev, autoPaletteSource: 'albumArt' }))}
                className={`flex-1 py-1.5 rounded text-xs transition-colors flex items-center justify-center gap-1.5 ${
                  settings.autoPaletteSource === 'albumArt'
                    ? 'bg-neutral-800 text-amber-400 font-medium shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Album Art Visual Colors</span>
              </button>
            </div>
          </div>

          {/* Mood Style Selector */}
          <div className="space-y-2">
            <span className="text-neutral-400 block font-medium">Harmonic Mood Tuning:</span>
            <select
              value={settings.autoPaletteMood || 'neon'}
              onChange={(e) => onUpdateSettings(prev => ({ ...prev, autoPaletteMood: e.target.value as any, autoPaletteEnabled: true }))}
              className="w-full bg-neutral-950 text-neutral-200 border border-neutral-800 rounded-lg p-2 text-xs focus:outline-none focus:border-amber-500/50"
            >
              <option value="neon">Cyber Neon (Electric Cyan, Violet & Magenta)</option>
              <option value="warm">Analog Warmth (Incandescent Amber & Solar Gold)</option>
              <option value="ambient">Ethereal Ambient (Deep Oceanic Teal & Glacial Blue)</option>
              <option value="vibrant">Full Chromatic Rainbow (Energy-Driven Spectrum)</option>
              <option value="monochrome">Monochrome Studio (Pure Silver & Gunmetal)</option>
            </select>
          </div>
        </div>

        {/* Album Art Palette Picker (if albumArt mode or preview) */}
        {settings.autoPaletteSource === 'albumArt' && (
          <div className="pt-2 border-t border-neutral-800 space-y-2 text-xs">
            <span className="text-neutral-400 block font-medium">
              Sample Album Art or Upload Cover:
            </span>
            <div className="flex flex-wrap items-center gap-3">
              {SAMPLE_ALBUM_ARTS.map((art) => (
                <button
                  key={art.name}
                  onClick={() => handleExtractFromArtwork(art.url)}
                  className="flex items-center gap-2 p-1.5 bg-neutral-950 rounded-lg border border-neutral-800 hover:border-neutral-700 transition-colors"
                >
                  <img src={art.url} alt={art.name} className="w-6 h-6 rounded object-cover" />
                  <span className="text-neutral-300 pr-1">{art.name}</span>
                </button>
              ))}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 text-neutral-200 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Custom Art</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Dynamic Audio-Reactive Background Options */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Dynamic Audio-Reactive Background Options</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Select an ambient background pattern that dynamically pulses and warps with the music
            </p>
          </div>

          {/* Opacity slider */}
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <span>Intensity:</span>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={settings.backgroundOpacity ?? 0.8}
              onChange={(e) => onUpdateSettings(prev => ({ ...prev, backgroundOpacity: parseFloat(e.target.value) }))}
              className="w-20 accent-amber-400 h-1 bg-neutral-800 rounded cursor-pointer"
            />
            <span className="font-mono tabular-nums text-neutral-200 w-8">
              {Math.round((settings.backgroundOpacity ?? 0.8) * 100)}%
            </span>
          </div>
        </div>

        {/* 6 Dynamic Background Style Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BACKGROUND_OPTIONS.map((bg) => {
            const Icon = bg.icon;
            const isSelected = (settings.backgroundStyle || 'deep-slate') === bg.id;

            return (
              <button
                key={bg.id}
                onClick={() => onUpdateSettings(prev => ({ ...prev, backgroundStyle: bg.id }))}
                className={`text-left p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-neutral-800/90 border-amber-500/70 ring-1 ring-amber-500/30 text-neutral-100'
                    : 'bg-neutral-950/60 border-neutral-800/80 hover:bg-neutral-900 hover:border-neutral-700 text-neutral-300'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className={`p-1.5 rounded ${isSelected ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-800 text-neutral-400'}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className={`text-xs font-semibold ${isSelected ? 'text-amber-400' : 'text-neutral-200'}`}>
                    {bg.name}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  {bg.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Curated Preset Palettes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Curated Color Palettes</span>
          </h3>
          <span className="text-xs text-neutral-400">8 High-Contrast Themes</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {PRESET_PALETTES.map((p) => {
            const isSelected = settings.paletteId === p.id && !settings.autoPaletteEnabled;
            const gradPreview = `linear-gradient(to right, ${p.stops.map(s => `${s.color} ${(s.position * 100).toFixed(0)}%`).join(', ')})`;

            return (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? 'bg-neutral-900 border-amber-500/70 ring-1 ring-amber-500/30'
                    : 'bg-neutral-900/60 border-neutral-800 hover:bg-neutral-900 hover:border-neutral-700'
                }`}
              >
                <div
                  className="h-4 rounded mb-2 w-full border border-neutral-700/50 shadow-inner"
                  style={{ background: gradPreview }}
                />
                <div className={`text-xs font-semibold truncate ${isSelected ? 'text-amber-400' : 'text-neutral-200'}`}>
                  {p.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Interactive Multi-Stop Gradient Designer */}
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider">
              Gradient Stop Editor
            </h4>
            <p className="text-xs text-neutral-400 mt-0.5">
              Customize colors and frequency interpolation points in real time
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToPreset}
              className="px-2.5 py-1 text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded border border-neutral-800 flex items-center gap-1.5 transition-colors"
              title="Reset stops to preset defaults"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleAddStop}
              className="px-2.5 py-1 text-xs text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded font-medium flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Add Stop</span>
            </button>
          </div>
        </div>

        {/* Live Gradient Preview Bar */}
        <div
          className="h-8 rounded-lg w-full border border-neutral-700/80 shadow-inner transition-all"
          style={{ background: gradientCss }}
        />

        {/* Color Stops List */}
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {settings.customStops.map((stop, idx) => (
            <div
              key={stop.id}
              className="flex items-center justify-between gap-3 p-2 bg-neutral-950/80 rounded-lg border border-neutral-800/80 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-neutral-500 w-4 text-center">
                  #{idx + 1}
                </span>
                <input
                  type="color"
                  value={stop.color}
                  onChange={(e) => handleUpdateStopColor(stop.id, e.target.value)}
                  className="w-7 h-7 rounded border border-neutral-700 bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={stop.color.toUpperCase()}
                  onChange={(e) => handleUpdateStopColor(stop.id, e.target.value)}
                  className="w-20 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded font-mono text-neutral-200 text-xs uppercase"
                />
              </div>

              {/* Stop Position Slider */}
              <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                <span className="text-neutral-500 text-[11px]">Pos:</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={stop.position}
                  onChange={(e) => handleUpdateStopPos(stop.id, parseFloat(e.target.value))}
                  className="w-full accent-amber-400 h-1 bg-neutral-800 rounded cursor-pointer"
                />
                <span className="font-mono tabular-nums text-neutral-300 w-10 text-right">
                  {Math.round(stop.position * 100)}%
                </span>
              </div>

              {/* Delete Stop button */}
              <button
                onClick={() => handleRemoveStop(stop.id)}
                disabled={settings.customStops.length <= 2}
                className="p-1 text-neutral-500 hover:text-red-400 disabled:opacity-30 disabled:hover:text-neutral-500 transition-colors"
                title={settings.customStops.length <= 2 ? 'Minimum 2 stops required' : 'Remove stop'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Smooth Animation Effects & Physics Engine */}
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-xl p-4 space-y-4">
        <h4 className="text-xs font-semibold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>Smooth Animation & Physics Controls</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Phosphor Persistence / Motion Blur */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-neutral-400">
              <span>Phosphor Persistence / Trail:</span>
              <span className="font-mono tabular-nums text-neutral-200">
                {Math.round(settings.decayRate * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.95"
              step="0.05"
              value={settings.decayRate}
              onChange={(e) => onUpdateSettings(prev => ({ ...prev, decayRate: parseFloat(e.target.value) }))}
              className="w-full accent-amber-400 h-1 bg-neutral-800 rounded cursor-pointer"
            />
          </div>

          {/* Neon Glow & Bloom Intensity */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-neutral-400">
              <span>Glow & Bloom Intensity:</span>
              <span className="font-mono tabular-nums text-neutral-200">
                {(settings.glowIntensity * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="2.0"
              step="0.1"
              value={settings.glowIntensity}
              onChange={(e) => onUpdateSettings(prev => ({ ...prev, glowIntensity: parseFloat(e.target.value) }))}
              className="w-full accent-amber-400 h-1 bg-neutral-800 rounded cursor-pointer"
            />
          </div>

          {/* FFT Smoothing Constant */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-neutral-400">
              <span>FFT Smoothing Factor:</span>
              <span className="font-mono tabular-nums text-neutral-200">
                {settings.smoothing.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.95"
              step="0.02"
              value={settings.smoothing}
              onChange={(e) => onUpdateSettings(prev => ({ ...prev, smoothing: parseFloat(e.target.value) }))}
              className="w-full accent-amber-400 h-1 bg-neutral-800 rounded cursor-pointer"
            />
          </div>

          {/* Peak Cap Gravity Falloff */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-neutral-400">
              <span>Peak Gravity Falloff:</span>
              <span className="font-mono tabular-nums text-neutral-200">
                {settings.peakGravity.toFixed(1)} G
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="2.5"
              step="0.1"
              value={settings.peakGravity}
              onChange={(e) => onUpdateSettings(prev => ({ ...prev, peakGravity: parseFloat(e.target.value) }))}
              className="w-full accent-amber-400 h-1 bg-neutral-800 rounded cursor-pointer"
            />
          </div>

          {/* Peak Hold Duration */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-neutral-400">
              <span>Peak Hold Duration:</span>
              <span className="font-mono tabular-nums text-neutral-200">
                {settings.peakHoldMs} ms
              </span>
            </div>
            <input
              type="range"
              min="100"
              max="1200"
              step="50"
              value={settings.peakHoldMs}
              onChange={(e) => onUpdateSettings(prev => ({ ...prev, peakHoldMs: parseInt(e.target.value) }))}
              className="w-full accent-amber-400 h-1 bg-neutral-800 rounded cursor-pointer"
            />
          </div>

          {/* Bar Gap */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-neutral-400">
              <span>Spectrum Bar Spacing:</span>
              <span className="font-mono tabular-nums text-neutral-200">
                {settings.barGap} px
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              step="1"
              value={settings.barGap}
              onChange={(e) => onUpdateSettings(prev => ({ ...prev, barGap: parseInt(e.target.value) }))}
              className="w-full accent-amber-400 h-1 bg-neutral-800 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-neutral-800 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
            <input
              type="checkbox"
              checked={settings.showPeaks}
              onChange={(e) => onUpdateSettings(prev => ({ ...prev, showPeaks: e.target.checked }))}
              className="rounded accent-amber-400"
            />
            <span>Show Floating Peak Caps</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
            <input
              type="checkbox"
              checked={settings.showFloorReflection}
              onChange={(e) => onUpdateSettings(prev => ({ ...prev, showFloorReflection: e.target.checked }))}
              className="rounded accent-amber-400"
            />
            <span>Mirror Floor Reflection</span>
          </label>

          <div className="flex items-center gap-2 text-neutral-400 ml-auto">
            <span>Stereo Mode:</span>
            <select
              value={settings.stereoMode}
              onChange={(e) => onUpdateSettings(prev => ({ ...prev, stereoMode: e.target.value as 'stereo' | 'mono' }))}
              className="bg-neutral-950 text-neutral-200 border border-neutral-800 rounded px-2 py-1 text-xs"
            >
              <option value="stereo">Dual L/R Stereo</option>
              <option value="mono">Combined Mono</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
