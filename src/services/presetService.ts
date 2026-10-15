import { VisualizerPreset, VisualizerSettings } from '../types/visualizer';
import { PRESET_PALETTES } from './paletteService';

const STORAGE_KEY = 'aimp_visualizer_saved_presets_v1';

export const FACTORY_PRESETS: VisualizerPreset[] = [
  {
    id: 'preset-aimp-classic',
    name: 'AIMP Classic Gold Peak',
    author: 'AIMP Studio',
    createdAt: Date.now() - 100000,
    isFavorite: true,
    settings: {
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
      autoPaletteMood: 'warm',
      albumArtUrl: null
    }
  },
  {
    id: 'preset-cyber-tokyo',
    name: 'Cyber Tokyo Neon Pulse',
    author: 'AIMP Studio',
    createdAt: Date.now() - 80000,
    isFavorite: true,
    settings: {
      mode: 'radial-nebula',
      paletteId: 'tokyo-cyberpunk',
      customStops: PRESET_PALETTES[1].stops.map(s => ({ ...s })),
      fftSize: 1024,
      smoothing: 0.85,
      glowIntensity: 1.5,
      decayRate: 0.35,
      peakGravity: 1.2,
      peakHoldMs: 350,
      barWidthMultiplier: 1.0,
      barGap: 2,
      sensitivity: 1.3,
      stereoMode: 'stereo',
      showPeaks: true,
      showFloorReflection: false,
      mirrorChannels: true,
      wireframeDensity: 24,
      particleCount: 160,
      backgroundStyle: 'reactive-vignette-pulse',
      backgroundOpacity: 0.85,
      autoPaletteEnabled: false,
      autoPaletteSource: 'audio',
      autoPaletteMood: 'neon',
      albumArtUrl: null
    }
  },
  {
    id: 'preset-synthwave-horizon',
    name: 'Outrun 1984 Wireframe',
    author: 'AIMP Studio',
    createdAt: Date.now() - 60000,
    isFavorite: false,
    settings: {
      mode: 'horizon-3d',
      paletteId: 'synthwave-sunset',
      customStops: PRESET_PALETTES[3].stops.map(s => ({ ...s })),
      fftSize: 1024,
      smoothing: 0.8,
      glowIntensity: 1.4,
      decayRate: 0.3,
      peakGravity: 1.0,
      peakHoldMs: 400,
      barWidthMultiplier: 1.0,
      barGap: 2,
      sensitivity: 1.15,
      stereoMode: 'stereo',
      showPeaks: false,
      showFloorReflection: false,
      mirrorChannels: false,
      wireframeDensity: 28,
      particleCount: 100,
      backgroundStyle: 'cyber-grid-mesh',
      backgroundOpacity: 0.75,
      autoPaletteEnabled: false,
      autoPaletteSource: 'audio',
      autoPaletteMood: 'warm',
      albumArtUrl: null
    }
  },
  {
    id: 'preset-mastering-vector',
    name: 'CRT Phosphor Goniometer',
    author: 'AIMP Studio',
    createdAt: Date.now() - 40000,
    isFavorite: true,
    settings: {
      mode: 'lissajous-phase',
      paletteId: 'matrix-phosphor',
      customStops: PRESET_PALETTES[2].stops.map(s => ({ ...s })),
      fftSize: 2048,
      smoothing: 0.75,
      glowIntensity: 1.6,
      decayRate: 0.45,
      peakGravity: 1.0,
      peakHoldMs: 500,
      barWidthMultiplier: 1.0,
      barGap: 2,
      sensitivity: 1.1,
      stereoMode: 'stereo',
      showPeaks: false,
      showFloorReflection: false,
      mirrorChannels: false,
      wireframeDensity: 20,
      particleCount: 80,
      backgroundStyle: 'deep-slate',
      backgroundOpacity: 0.9,
      autoPaletteEnabled: false,
      autoPaletteSource: 'audio',
      autoPaletteMood: 'ambient',
      albumArtUrl: null
    }
  },
  {
    id: 'preset-liquid-abyss',
    name: 'Bioluminescent Abyss Bloom',
    author: 'AIMP Studio',
    createdAt: Date.now() - 20000,
    isFavorite: false,
    settings: {
      mode: 'liquid-plasma',
      paletteId: 'bioluminescent-abyss',
      customStops: PRESET_PALETTES[4].stops.map(s => ({ ...s })),
      fftSize: 1024,
      smoothing: 0.88,
      glowIntensity: 1.3,
      decayRate: 0.28,
      peakGravity: 0.9,
      peakHoldMs: 450,
      barWidthMultiplier: 1.0,
      barGap: 2,
      sensitivity: 1.25,
      stereoMode: 'stereo',
      showPeaks: false,
      showFloorReflection: false,
      mirrorChannels: false,
      wireframeDensity: 24,
      particleCount: 140,
      backgroundStyle: 'nebula-particle-drift',
      backgroundOpacity: 0.8,
      autoPaletteEnabled: false,
      autoPaletteSource: 'audio',
      autoPaletteMood: 'ambient',
      albumArtUrl: null
    }
  },
  {
    id: 'preset-warp-spectrogram',
    name: 'Hyperspace Waterfall',
    author: 'AIMP Studio',
    createdAt: Date.now() - 10000,
    isFavorite: false,
    settings: {
      mode: 'warp-tunnel',
      paletteId: 'solar-flare',
      customStops: PRESET_PALETTES[5].stops.map(s => ({ ...s })),
      fftSize: 1024,
      smoothing: 0.84,
      glowIntensity: 1.5,
      decayRate: 0.32,
      peakGravity: 1.3,
      peakHoldMs: 300,
      barWidthMultiplier: 1.0,
      barGap: 2,
      sensitivity: 1.35,
      stereoMode: 'stereo',
      showPeaks: true,
      showFloorReflection: false,
      mirrorChannels: false,
      wireframeDensity: 24,
      particleCount: 180,
      backgroundStyle: 'frequency-waterfall',
      backgroundOpacity: 0.7,
      autoPaletteEnabled: false,
      autoPaletteSource: 'audio',
      autoPaletteMood: 'vibrant',
      albumArtUrl: null
    }
  }
];

class PresetService {
  private presets: VisualizerPreset[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: VisualizerPreset[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.presets = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse presets from localStorage, loading factory defaults:', e);
    }
    this.presets = [...FACTORY_PRESETS];
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.presets));
    } catch (e) {
      console.error('Failed to save presets to localStorage:', e);
    }
  }

  public getAll(): VisualizerPreset[] {
    return [...this.presets];
  }

  public getById(id: string): VisualizerPreset | undefined {
    return this.presets.find(p => p.id === id);
  }

  public savePreset(name: string, settings: VisualizerSettings): VisualizerPreset {
    const id = 'preset-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const newPreset: VisualizerPreset = {
      id,
      name: name.trim() || 'Custom Preset',
      author: 'User',
      createdAt: Date.now(),
      isFavorite: false,
      settings: JSON.parse(JSON.stringify(settings))
    };

    this.presets.unshift(newPreset);
    this.saveToStorage();
    return newPreset;
  }

  public updatePreset(id: string, name: string, settings: VisualizerSettings): boolean {
    const idx = this.presets.findIndex(p => p.id === id);
    if (idx === -1) return false;

    this.presets[idx] = {
      ...this.presets[idx],
      name: name.trim() || this.presets[idx].name,
      settings: JSON.parse(JSON.stringify(settings))
    };
    this.saveToStorage();
    return true;
  }

  public toggleFavorite(id: string): boolean {
    const preset = this.presets.find(p => p.id === id);
    if (!preset) return false;
    preset.isFavorite = !preset.isFavorite;
    this.saveToStorage();
    return true;
  }

  public deletePreset(id: string): boolean {
    const initialLen = this.presets.length;
    this.presets = this.presets.filter(p => p.id !== id);
    if (this.presets.length !== initialLen) {
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public importPreset(presetData: any): VisualizerPreset | null {
    if (!presetData || !presetData.settings || !presetData.name) {
      // Check if it's a raw VisualizerSettings object
      if (presetData.mode && presetData.customStops) {
        return this.savePreset('Imported Preset', presetData);
      }
      return null;
    }

    const newPreset: VisualizerPreset = {
      id: 'preset-' + Date.now(),
      name: presetData.name,
      author: presetData.author || 'Imported',
      createdAt: Date.now(),
      isFavorite: false,
      settings: presetData.settings
    };

    this.presets.unshift(newPreset);
    this.saveToStorage();
    return newPreset;
  }

  public resetToFactory(): VisualizerPreset[] {
    this.presets = [...FACTORY_PRESETS];
    this.saveToStorage();
    return this.presets;
  }
}

export const presetService = new PresetService();
