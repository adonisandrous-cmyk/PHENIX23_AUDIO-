import { ColorPalette, ColorStop } from '../types/visualizer';

export const PRESET_PALETTES: ColorPalette[] = [
  {
    id: 'aimp-amber',
    name: 'AIMP Amber Classic',
    description: 'Iconic warm vacuum incandescent glow matching default AIMP skins',
    accentColor: '#f59e0b',
    backgroundGlow: 'rgba(245, 158, 11, 0.15)',
    stops: [
      { id: '1', position: 0.0, color: '#1c0e03' },
      { id: '2', position: 0.25, color: '#b45309' },
      { id: '3', position: 0.65, color: '#f59e0b' },
      { id: '4', position: 0.9, color: '#fbbf24' },
      { id: '5', position: 1.0, color: '#fef08a' }
    ]
  },
  {
    id: 'tokyo-cyberpunk',
    name: 'Tokyo Cyberpunk',
    description: 'High-contrast electric cyan, ultraviolet, and hot magenta neon',
    accentColor: '#06b6d4',
    backgroundGlow: 'rgba(6, 182, 212, 0.15)',
    stops: [
      { id: '1', position: 0.0, color: '#03071e' },
      { id: '2', position: 0.25, color: '#06b6d4' },
      { id: '3', position: 0.55, color: '#8b5cf6' },
      { id: '4', position: 0.85, color: '#ec4899' },
      { id: '5', position: 1.0, color: '#f43f5e' }
    ]
  },
  {
    id: 'matrix-phosphor',
    name: 'Matrix Phosphor',
    description: 'Classic P31 green cathode ray tube oscilloscope luminescence',
    accentColor: '#22c55e',
    backgroundGlow: 'rgba(34, 197, 94, 0.15)',
    stops: [
      { id: '1', position: 0.0, color: '#021a08' },
      { id: '2', position: 0.3, color: '#15803d' },
      { id: '3', position: 0.65, color: '#22c55e' },
      { id: '4', position: 0.9, color: '#86efac' },
      { id: '5', position: 1.0, color: '#f0fdf4' }
    ]
  },
  {
    id: 'synthwave-sunset',
    name: 'Synthwave Sunset',
    description: 'Outrun dusk with deep violet horizon, coral pink, and golden solar yellow',
    accentColor: '#f97316',
    backgroundGlow: 'rgba(249, 115, 22, 0.15)',
    stops: [
      { id: '1', position: 0.0, color: '#1e0533' },
      { id: '2', position: 0.3, color: '#6b21a8' },
      { id: '3', position: 0.6, color: '#db2777' },
      { id: '4', position: 0.85, color: '#f97316' },
      { id: '5', position: 1.0, color: '#fde047' }
    ]
  },
  {
    id: 'bioluminescent-abyss',
    name: 'Bioluminescent Abyss',
    description: 'Deep oceanic trench glow with teal, emerald, and luminous cyan',
    accentColor: '#14b8a6',
    backgroundGlow: 'rgba(20, 184, 166, 0.15)',
    stops: [
      { id: '1', position: 0.0, color: '#021d1d' },
      { id: '2', position: 0.3, color: '#0f766e' },
      { id: '3', position: 0.65, color: '#14b8a6' },
      { id: '4', position: 0.88, color: '#2dd4bf' },
      { id: '5', position: 1.0, color: '#99f6e4' }
    ]
  },
  {
    id: 'solar-flare',
    name: 'Solar Flare',
    description: 'Molten plasma dynamics from deep crimson to blinding incandescent white',
    accentColor: '#ea580c',
    backgroundGlow: 'rgba(234, 88, 12, 0.15)',
    stops: [
      { id: '1', position: 0.0, color: '#1f0303' },
      { id: '2', position: 0.3, color: '#991b1b' },
      { id: '3', position: 0.65, color: '#ea580c' },
      { id: '4', position: 0.88, color: '#facc15' },
      { id: '5', position: 1.0, color: '#ffffff' }
    ]
  },
  {
    id: 'nordic-frost',
    name: 'Nordic Frost',
    description: 'Sub-zero crystal spectrum with glacial cobalt, cyan ice, and crisp silver',
    accentColor: '#38bdf8',
    backgroundGlow: 'rgba(56, 189, 248, 0.15)',
    stops: [
      { id: '1', position: 0.0, color: '#030f24' },
      { id: '2', position: 0.3, color: '#1e40af' },
      { id: '3', position: 0.65, color: '#0284c7' },
      { id: '4', position: 0.88, color: '#38bdf8' },
      { id: '5', position: 1.0, color: '#e0f2fe' }
    ]
  },
  {
    id: 'monochrome-studio',
    name: 'Monochrome Studio',
    description: 'Clean reference audio mastering aesthetics with graphite, steel, and stark white',
    accentColor: '#e4e4e7',
    backgroundGlow: 'rgba(228, 228, 231, 0.12)',
    stops: [
      { id: '1', position: 0.0, color: '#09090b' },
      { id: '2', position: 0.35, color: '#3f3f46' },
      { id: '3', position: 0.7, color: '#71717a' },
      { id: '4', position: 0.9, color: '#d4d4d8' },
      { id: '5', position: 1.0, color: '#ffffff' }
    ]
  }
];

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function hexToRgb(hex: string): RGB {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    return {
      r: parseInt(cleanHex[0] + cleanHex[0], 16),
      g: parseInt(cleanHex[1] + cleanHex[1], 16),
      b: parseInt(cleanHex[2] + cleanHex[2], 16)
    };
  }
  return {
    r: parseInt(cleanHex.substring(0, 2), 16) || 0,
    g: parseInt(cleanHex.substring(2, 4), 16) || 0,
    b: parseInt(cleanHex.substring(4, 6), 16) || 0
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hexToRgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Interpolates color at position t (0.0 to 1.0) along stops
 */
export function interpolateStops(stops: ColorStop[], t: number): RGB {
  if (!stops || stops.length === 0) return { r: 255, g: 255, b: 255 };
  if (stops.length === 1) return hexToRgb(stops[0].color);

  const sorted = [...stops].sort((a, b) => a.position - b.position);
  const clampedT = Math.max(0, Math.min(1, t));

  if (clampedT <= sorted[0].position) return hexToRgb(sorted[0].color);
  if (clampedT >= sorted[sorted.length - 1].position) return hexToRgb(sorted[sorted.length - 1].color);

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    if (clampedT >= current.position && clampedT <= next.position) {
      const span = next.position - current.position;
      const factor = span === 0 ? 0 : (clampedT - current.position) / span;
      const c1 = hexToRgb(current.color);
      const c2 = hexToRgb(next.color);
      return {
        r: Math.round(c1.r + (c2.r - c1.r) * factor),
        g: Math.round(c1.g + (c2.g - c1.g) * factor),
        b: Math.round(c1.b + (c2.b - c1.b) * factor)
      };
    }
  }

  return hexToRgb(sorted[sorted.length - 1].color);
}

/**
 * Builds a 256-entry lookup table for high-speed frame rendering
 */
export function generateColorLut(stops: ColorStop[], size = 256): string[] {
  const lut: string[] = [];
  for (let i = 0; i < size; i++) {
    const t = i / (size - 1);
    const rgb = interpolateStops(stops, t);
    lut.push(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`);
  }
  return lut;
}

/**
 * Builds RGB integer LUT (0x00BBGGRR or 0x00RRGGBB) for C++ / Delphi export
 */
export function generateNativeColorLut(stops: ColorStop[], size = 256): number[] {
  const lut: number[] = [];
  for (let i = 0; i < size; i++) {
    const t = i / (size - 1);
    const rgb = interpolateStops(stops, t);
    // Win32 COLORREF format: 0x00BBGGRR
    const colorRef = (rgb.b << 16) | (rgb.g << 8) | rgb.r;
    lut.push(colorRef);
  }
  return lut;
}
