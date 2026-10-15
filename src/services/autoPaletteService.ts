import { ColorStop, AudioMetrics } from '../types/visualizer';
import { rgbToHex } from './paletteService';

// HSL to RGB helper
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(1, s));
  l = Math.max(0, Math.min(1, l));

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

let smoothedBaseHue = 35; // default amber

/**
 * Generates dynamic color stops in real-time from audio spectrum and energy metrics
 */
export function generateAutoPaletteFromAudio(
  freqData: Uint8Array,
  metrics: AudioMetrics,
  mood: 'neon' | 'warm' | 'ambient' | 'monochrome' | 'vibrant' = 'neon'
): ColorStop[] {
  // 1. Calculate spectral centroid
  let weightedSum = 0;
  let totalSum = 0;
  const len = Math.min(freqData.length, 256);
  for (let i = 0; i < len; i++) {
    const amp = freqData[i];
    weightedSum += i * amp;
    totalSum += amp;
  }
  const centroidNorm = totalSum > 0 ? (weightedSum / totalSum) / len : 0.2;

  // 2. Compute target base hue depending on mood
  let targetHue = 35;
  let saturation = 0.85;

  switch (mood) {
    case 'warm':
      // Amber/Gold/Crimson range (15° to 50°)
      targetHue = 15 + centroidNorm * 40 + metrics.bass * 15;
      saturation = 0.9;
      break;
    case 'ambient':
      // Oceanic Cyan/Teal/Blue range (170° to 240°)
      targetHue = 175 + centroidNorm * 65;
      saturation = 0.75;
      break;
    case 'monochrome':
      // Desaturated silver
      targetHue = 210;
      saturation = 0.05;
      break;
    case 'vibrant':
      // Full chromatic sweep based on centroid
      targetHue = (centroidNorm * 360 + metrics.bass * 60) % 360;
      saturation = 0.95;
      break;
    case 'neon':
    default:
      // Electric Cyan/Purple/Pink range (180° to 330°)
      targetHue = (180 + centroidNorm * 160 + metrics.treble * 40) % 360;
      saturation = 0.95;
      break;
  }

  // Smooth hue drift across frames to avoid jarring flicker
  smoothedBaseHue += (targetHue - smoothedBaseHue) * 0.05;

  // 3. Build 5 harmonious stops: Dark Base -> Harmonic -> Dominant -> Highlight -> Bright Peak
  const stops: ColorStop[] = [
    {
      id: 'auto-1',
      position: 0.0,
      color: rgbToHex(...Object.values(hslToRgb(smoothedBaseHue - 20, saturation * 0.8, 0.06)) as [number, number, number])
    },
    {
      id: 'auto-2',
      position: 0.25,
      color: rgbToHex(...Object.values(hslToRgb(smoothedBaseHue - 10, saturation, 0.28 + metrics.bass * 0.12)) as [number, number, number])
    },
    {
      id: 'auto-3',
      position: 0.60,
      color: rgbToHex(...Object.values(hslToRgb(smoothedBaseHue, saturation, 0.50 + metrics.mid * 0.15)) as [number, number, number])
    },
    {
      id: 'auto-4',
      position: 0.88,
      color: rgbToHex(...Object.values(hslToRgb(smoothedBaseHue + 25, saturation, 0.72 + metrics.treble * 0.15)) as [number, number, number])
    },
    {
      id: 'auto-5',
      position: 1.0,
      color: rgbToHex(...Object.values(hslToRgb(smoothedBaseHue + 40, saturation * 0.5, 0.92)) as [number, number, number])
    }
  ];

  return stops;
}

/**
 * Extracts dominant color palette stops from an image URL or File
 */
export async function extractPaletteFromAlbumArt(imageSrc: string): Promise<ColorStop[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(fallbackAlbumArtPalette());
          return;
        }

        const size = 64;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;
        const colorBuckets: { r: number; g: number; b: number; count: number; lum: number }[] = [];

        // Sample pixels with quantization (16x16x16 color space)
        const step = 4;
        for (let i = 0; i < imgData.length; i += 4 * step) {
          const r = Math.floor(imgData[i] / 24) * 24;
          const g = Math.floor(imgData[i + 1] / 24) * 24;
          const b = Math.floor(imgData[i + 2] / 24) * 24;
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;

          const existing = colorBuckets.find(bucket => 
            Math.abs(bucket.r - r) < 20 && Math.abs(bucket.g - g) < 20 && Math.abs(bucket.b - b) < 20
          );

          if (existing) {
            existing.count++;
          } else {
            colorBuckets.push({ r, g, b, count: 1, lum });
          }
        }

        // Sort by frequency and luminance
        colorBuckets.sort((a, b) => b.count - a.count);
        const topColors = colorBuckets.slice(0, 8);
        topColors.sort((a, b) => a.lum - b.lum);

        if (topColors.length < 3) {
          resolve(fallbackAlbumArtPalette());
          return;
        }

        // Create 5 progressive stops from darkest to luminous
        const dark = topColors[0];
        const midLow = topColors[Math.min(1, topColors.length - 1)];
        const dominant = topColors[Math.floor(topColors.length / 2)];
        const bright = topColors[topColors.length - 2] || topColors[topColors.length - 1];
        const peak = topColors[topColors.length - 1];

        const stops: ColorStop[] = [
          { id: 'art-1', position: 0.0, color: rgbToHex(Math.min(25, dark.r), Math.min(25, dark.g), Math.min(25, dark.b)) },
          { id: 'art-2', position: 0.28, color: rgbToHex(midLow.r, midLow.g, midLow.b) },
          { id: 'art-3', position: 0.62, color: rgbToHex(dominant.r, dominant.g, dominant.b) },
          { id: 'art-4', position: 0.88, color: rgbToHex(bright.r, bright.g, bright.b) },
          { id: 'art-5', position: 1.0, color: rgbToHex(Math.max(220, peak.r), Math.max(220, peak.g), Math.max(220, peak.b)) }
        ];

        resolve(stops);
      } catch (err) {
        console.warn('Canvas album art extraction error:', err);
        resolve(fallbackAlbumArtPalette());
      }
    };
    img.onerror = () => {
      resolve(fallbackAlbumArtPalette());
    };
    img.src = imageSrc;
  });
}

function fallbackAlbumArtPalette(): ColorStop[] {
  return [
    { id: 'fb-1', position: 0.0, color: '#09090b' },
    { id: 'fb-2', position: 0.25, color: '#3b82f6' },
    { id: 'fb-3', position: 0.6, color: '#8b5cf6' },
    { id: 'fb-4', position: 0.88, color: '#ec4899' },
    { id: 'fb-5', position: 1.0, color: '#ffffff' }
  ];
}
