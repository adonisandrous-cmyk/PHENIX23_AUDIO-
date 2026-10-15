export type VisualizerMode = 
  | 'classic-spectrum'
  | 'radial-nebula'
  | 'horizon-3d'
  | 'lissajous-phase'
  | 'liquid-plasma'
  | 'warp-tunnel';

export type BackgroundStyle = 
  | 'deep-slate'
  | 'reactive-vignette-pulse'
  | 'frequency-waterfall'
  | 'cyber-grid-mesh'
  | 'nebula-particle-drift'
  | 'audio-reactive-waves';

export interface ColorStop {
  id: string;
  position: number; // 0.0 to 1.0
  color: string;    // HEX string #RRGGBB
}

export interface ColorPalette {
  id: string;
  name: string;
  description: string;
  stops: ColorStop[];
  accentColor: string;
  backgroundGlow: string;
}

export interface VisualizerSettings {
  mode: VisualizerMode;
  paletteId: string;
  customStops: ColorStop[];
  fftSize: 256 | 512 | 1024 | 2048;
  smoothing: number;        // 0.0 to 0.95
  glowIntensity: number;    // 0.0 to 2.0
  decayRate: number;        // Frame persistence / motion blur 0.0 to 0.95
  peakGravity: number;      // Gravity for peak caps in spectrum (0.2 to 2.5)
  peakHoldMs: number;       // Time in ms before peak drops (100 to 1200)
  barWidthMultiplier: number; // Bar width scaling
  barGap: number;           // Gap in px
  sensitivity: number;      // Gain multiplier (0.5 to 3.0)
  stereoMode: 'stereo' | 'mono' | 'mid-side';
  showPeaks: boolean;
  showFloorReflection: boolean;
  mirrorChannels: boolean;
  wireframeDensity: number; // For 3D modes
  particleCount: number;    // For radial / particles
  
  // Dynamic Background Options
  backgroundStyle: BackgroundStyle;
  backgroundOpacity: number; // 0.1 to 1.0

  // Real-time Auto-Palette Generation
  autoPaletteEnabled: boolean;
  autoPaletteSource: 'audio' | 'albumArt';
  autoPaletteMood: 'neon' | 'warm' | 'ambient' | 'monochrome' | 'vibrant';
  albumArtUrl: string | null;
}

export interface VisualizerPreset {
  id: string;
  name: string;
  author: string;
  createdAt: number;
  isFavorite: boolean;
  settings: VisualizerSettings;
}

export interface AudioMetrics {
  bass: number;        // 0.0 to 1.0
  mid: number;         // 0.0 to 1.0
  treble: number;      // 0.0 to 1.0
  rms: number;         // 0.0 to 1.0
  peak: number;        // 0.0 to 1.0
  isBeat: boolean;     // transient beat detected
  instantBpm: number;
}

export interface AudioTrackInfo {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration: number;
  bpm: number;
  isSynthetic: boolean;
  albumArt?: string;
}

