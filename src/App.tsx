import { useState, useEffect, useCallback } from 'react';
import { VisualizerSettings, AudioMetrics, VisualizerPreset } from './types/visualizer';
import { PRESET_PALETTES } from './services/paletteService';
import { audioEngine } from './services/audioEngine';
import { TopNavigation, NavSection } from './components/TopNavigation';
import { VisualizerCanvas } from './visualizers/VisualizerCanvas';
import { AudioControlBar } from './components/AudioControlBar';
import { PresetSelectorBar } from './components/PresetSelectorBar';
import { VisualizerModeSelector } from './components/VisualizerModeSelector';
import { PaletteCustomizer } from './components/PaletteCustomizer';
import { AiVideoStoryboard } from './components/AiVideoStoryboard';
import { AimpStreamingGuide } from './components/AimpStreamingGuide';
import { AimpPluginHub } from './components/AimpPluginHub';
import { PresetManagerModal } from './components/PresetManagerModal';
import { Bookmark, Sparkles, SlidersHorizontal, Layers, Clapperboard, Radio } from 'lucide-react';

const DEFAULT_SETTINGS: VisualizerSettings = {
  mode: 'classic-spectrum',
  paletteId: 'aimp-amber',
  customStops: PRESET_PALETTES[0].stops.map(s => ({ ...s })),
  fftSize: 1024,
  smoothing: 0.82,
  glowIntensity: 1.2,
  decayRate: 0.25,
  peakGravity: 1.0,
  peakHoldMs: 400,
  barWidthMultiplier: 1.0,
  barGap: 2,
  sensitivity: 1.2,
  stereoMode: 'stereo',
  showPeaks: true,
  showFloorReflection: true,
  mirrorChannels: false,
  wireframeDensity: 24,
  particleCount: 120,
  backgroundStyle: 'deep-slate',
  backgroundOpacity: 0.8,
  autoPaletteEnabled: false,
  autoPaletteSource: 'audio',
  autoPaletteMood: 'neon',
  albumArtUrl: null
};

export default function App() {
  const [settings, setSettings] = useState<VisualizerSettings>(DEFAULT_SETTINGS);
  const [activePresetId, setActivePresetId] = useState<string>('preset-aimp-classic');
  const [activeSection, setActiveSection] = useState<NavSection>('studio');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [sourceType, setSourceType] = useState<'synth' | 'file' | 'mic'>('synth');
  const [volume, setVolume] = useState<number>(0.8);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<AudioMetrics>({
    bass: 0,
    mid: 0,
    treble: 0,
    rms: 0,
    peak: 0,
    isBeat: false,
    instantBpm: 118
  });

  // Sync with audio engine state changes
  useEffect(() => {
    const unsubscribe = audioEngine.subscribe(() => {
      setIsPlaying(audioEngine.getIsPlaying());
      setSourceType(audioEngine.getSourceType());
    });
    return () => unsubscribe();
  }, []);

  // Update audio engine parameters when settings change
  useEffect(() => {
    audioEngine.setFftSize(settings.fftSize);
    audioEngine.setSmoothing(settings.smoothing);
    audioEngine.setSensitivity(settings.sensitivity);
  }, [settings.fftSize, settings.smoothing, settings.sensitivity]);

  const handleVolumeChange = useCallback((newVol: number) => {
    setVolume(newVol);
    audioEngine.setVolume(newVol);
  }, []);

  const handleSensitivityChange = useCallback((newSens: number) => {
    setSettings(prev => ({ ...prev, sensitivity: newSens }));
    audioEngine.setSensitivity(newSens);
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  const handleApplyPreset = useCallback((preset: VisualizerPreset) => {
    setActivePresetId(preset.id);
    setSettings(JSON.parse(JSON.stringify(preset.settings)));
  }, []);

  const handleAutoPaletteStops = useCallback((newStops: any[]) => {
    setSettings(prev => ({ ...prev, customStops: newStops }));
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        audioEngine.togglePlay();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        setIsFullscreen(prev => !prev);
      } else if (e.code === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      } else if (e.key >= '1' && e.key <= '6') {
        const modes = [
          'classic-spectrum',
          'radial-nebula',
          'horizon-3d',
          'lissajous-phase',
          'liquid-plasma',
          'warp-tunnel'
        ] as const;
        const targetMode = modes[parseInt(e.key) - 1];
        if (targetMode) {
          setSettings(prev => ({ ...prev, mode: targetMode }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Bar Navigation */}
      <TopNavigation
        activeSection={activeSection}
        onSelectSection={(sec) => {
          setActiveSection(sec);
          if (sec !== 'studio') {
            const el = document.getElementById(sec);
            el?.scrollIntoView({ behavior: 'smooth' });
          }
        }}
        onExportPlugin={() => {
          setActiveSection('plugin-hub');
          const el = document.getElementById('plugin-hub');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Preset Selector Bar */}
        <PresetSelectorBar
          currentSettings={settings}
          activePresetId={activePresetId}
          onApplyPreset={handleApplyPreset}
          onOpenPresetModal={() => setIsPresetModalOpen(true)}
        />

        {/* Viewport Frame */}
        <section id="studio" className="space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-neutral-200 uppercase tracking-wider">
                Real-Time Viewport
              </span>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{settings.mode.replace('-', ' ')}</span>
              <span aria-hidden="true">·</span>
              <span>
                {settings.autoPaletteEnabled 
                  ? 'Reactive Auto-Palette' 
                  : (PRESET_PALETTES.find(p => p.id === settings.paletteId)?.name || 'Custom Palette')}
              </span>
              <span aria-hidden="true">·</span>
              <span className="capitalize text-neutral-400">
                {(settings.backgroundStyle || 'deep-slate').replace('-', ' ')}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPresetModalOpen(true)}
                className="hover:text-neutral-200 transition-colors flex items-center gap-1"
                title="Manage and export presets"
              >
                <Bookmark className="w-3.5 h-3.5" />
                <span>Presets (.aimpvis)</span>
              </button>
            </div>
          </div>

          {/* Master Canvas Container */}
          <div className="w-full h-[420px] sm:h-[480px] lg:h-[520px]">
            <VisualizerCanvas
              settings={settings}
              isFullscreen={isFullscreen}
              onToggleFullscreen={handleToggleFullscreen}
              onMetricsUpdate={setMetrics}
              onAutoPaletteStops={handleAutoPaletteStops}
            />
          </div>

          {/* Audio Playback & Control Bar */}
          <AudioControlBar
            isPlaying={isPlaying}
            sourceType={sourceType}
            volume={volume}
            sensitivity={settings.sensitivity}
            metrics={metrics}
            onVolumeChange={handleVolumeChange}
            onSensitivityChange={handleSensitivityChange}
          />
        </section>

        {/* Studio Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 text-xs font-medium overflow-x-auto">
          <button
            onClick={() => setActiveSection('modes')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
              activeSection === 'modes'
                ? 'bg-neutral-800 text-amber-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Visualizer Modes (1-6)</span>
          </button>

          <button
            onClick={() => setActiveSection('palettes')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
              activeSection === 'palettes'
                ? 'bg-neutral-800 text-amber-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Palettes, Auto-Gen & Backgrounds</span>
          </button>

          <button
            onClick={() => setActiveSection('ai-video')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
              activeSection === 'ai-video'
                ? 'bg-neutral-800 text-amber-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Clapperboard className="w-3.5 h-3.5" />
            <span>AI Music Video Sync</span>
          </button>

          <button
            onClick={() => setActiveSection('streaming')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
              activeSection === 'streaming'
                ? 'bg-neutral-800 text-amber-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>YouTube & Spotify in AIMP</span>
          </button>

          <button
            onClick={() => setActiveSection('plugin-hub')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
              activeSection === 'plugin-hub'
                ? 'bg-neutral-800 text-amber-400 font-semibold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>AIMP C++ & Delphi SDK</span>
          </button>
        </div>

        {/* Section: Visualizer Modes */}
        {(activeSection === 'studio' || activeSection === 'modes') && (
          <section id="modes" className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-neutral-100">
                Visualizer Rendering Algorithms
              </h3>
              <span className="text-xs text-neutral-400">
                Press keys 1–6 to instantly switch
              </span>
            </div>
            <VisualizerModeSelector
              currentMode={settings.mode}
              onSelectMode={(mode) => setSettings(prev => ({ ...prev, mode }))}
            />
          </section>
        )}

        {/* Section: Palette, Auto-Palette & Dynamic Background Customizer */}
        {(activeSection === 'studio' || activeSection === 'palettes') && (
          <section id="palettes" className="space-y-3 pt-2">
            <PaletteCustomizer
              settings={settings}
              onUpdateSettings={setSettings}
            />
          </section>
        )}

        {/* Section: AI Music Video Storyboard & Synced Cinematics */}
        {(activeSection === 'studio' || activeSection === 'ai-video') && (
          <section id="ai-video" className="space-y-3 pt-2">
            <AiVideoStoryboard
              settings={settings}
              metrics={metrics}
            />
          </section>
        )}

        {/* Section: YouTube & Spotify in AIMP Guide */}
        {(activeSection === 'studio' || activeSection === 'streaming') && (
          <section id="streaming" className="space-y-3 pt-2">
            <AimpStreamingGuide />
          </section>
        )}

        {/* Section: AIMP Plugin Hub (C++, Winamp, Delphi, CMake) */}
        {(activeSection === 'studio' || activeSection === 'plugin-hub') && (
          <section id="plugin-hub" className="space-y-3 pt-2">
            <AimpPluginHub settings={settings} />
          </section>
        )}
      </main>

      {/* Preset Modal */}
      <PresetManagerModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        settings={settings}
        onLoadSettings={(loaded) => {
          setSettings(loaded);
        }}
      />

      {/* Subtle Studio Footer */}
      <footer className="border-t border-neutral-900 bg-neutral-950 py-5 text-center text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span>AIMP Visualizer Studio</span>
            <span aria-hidden="true">·</span>
            <span>Windows x64 / x86 Architecture</span>
            <span aria-hidden="true">·</span>
            <span>WebAudio & GDI+ Direct2D Pipeline</span>
          </div>
          <div>
            Built for AIMP v4 / v5 Audio Player for Windows
          </div>
        </div>
      </footer>
    </div>
  );
}
