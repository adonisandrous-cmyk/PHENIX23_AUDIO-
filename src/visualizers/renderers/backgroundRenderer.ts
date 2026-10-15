import { AudioMetrics, VisualizerSettings, BackgroundStyle } from '../../types/visualizer';

// State caches for background animations
let waterfallHistory: Float32Array[] = [];
const WATERFALL_ROWS = 36;
const WATERFALL_COLS = 64;

interface AmbientDust {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}
const ambientDust: AmbientDust[] = [];
let wavePhase = 0;
let gridPulsePhase = 0;

export function renderDynamicBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  freqData: Uint8Array,
  metrics: AudioMetrics,
  settings: VisualizerSettings,
  colorLut: string[],
  deltaTime: number
) {
  const style: BackgroundStyle = settings.backgroundStyle || 'deep-slate';
  const opacity = settings.backgroundOpacity ?? 0.8;
  const accentColor = colorLut[Math.min(255, Math.floor(180 + metrics.bass * 70))] || colorLut[180];

  ctx.save();
  ctx.globalAlpha = opacity;

  switch (style) {
    case 'reactive-vignette-pulse': {
      // 1. Radial Vignette Pulse
      const cx = width / 2;
      const cy = height / 2;
      const maxR = Math.max(width, height) * 0.85;
      const pulseR = maxR * (0.8 + metrics.bass * 0.45);

      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, pulseR);
      grad.addColorStop(0, colorLut[Math.min(255, Math.floor(80 + metrics.bass * 120))]);
      grad.addColorStop(0.4, 'rgba(15, 15, 20, 0.4)');
      grad.addColorStop(1, '#0a0a0c');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      break;
    }

    case 'frequency-waterfall': {
      // 2. Spectrogram Waterfall History
      if (waterfallHistory.length === 0) {
        for (let i = 0; i < WATERFALL_ROWS; i++) {
          waterfallHistory.push(new Float32Array(WATERFALL_COLS));
        }
      }

      // Shift rows down and add current frequency slice
      const newRow = waterfallHistory.pop()!;
      for (let c = 0; c < WATERFALL_COLS; c++) {
        const norm = c / WATERFALL_COLS;
        const dataIdx = Math.floor(Math.pow(norm, 1.4) * (freqData.length * 0.7));
        newRow[c] = (freqData[Math.min(freqData.length - 1, dataIdx)] || 0) / 255;
      }
      waterfallHistory.unshift(newRow);

      const cellW = width / WATERFALL_COLS;
      const cellH = height / WATERFALL_ROWS;

      for (let r = 0; r < WATERFALL_ROWS; r++) {
        const row = waterfallHistory[r];
        const rowAlpha = (1 - (r / WATERFALL_ROWS) * 0.85) * 0.6;

        for (let c = 0; c < WATERFALL_COLS; c++) {
          const val = row[c];
          if (val > 0.08) {
            const lutIdx = Math.min(255, Math.floor(val * 240));
            ctx.fillStyle = colorLut[lutIdx];
            ctx.globalAlpha = opacity * rowAlpha * val;
            ctx.fillRect(c * cellW, r * cellH, cellW + 1, cellH + 1);
          }
        }
      }
      break;
    }

    case 'cyber-grid-mesh': {
      // 3. Cyber Grid Perspective Floor
      gridPulsePhase += (15 + metrics.bass * 40) * deltaTime;
      const horizonY = height * 0.45;
      const cx = width / 2;

      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 1;

      // Horizontal lines moving forward
      const numLines = 14;
      for (let i = 0; i < numLines; i++) {
        const t = (i + (gridPulsePhase % 10) / 10) / numLines;
        const y = horizonY + (height - horizonY) * Math.pow(t, 2.2);
        const alpha = Math.min(0.5, t * 0.75 * (1 + metrics.bass * 0.5));

        ctx.globalAlpha = opacity * alpha;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Vanishing point rays
      const rays = 18;
      for (let r = -rays; r <= rays; r++) {
        const spread = (r / rays) * width * 1.5;
        ctx.globalAlpha = opacity * 0.25;
        ctx.beginPath();
        ctx.moveTo(cx, horizonY);
        ctx.lineTo(cx + spread, height);
        ctx.stroke();
      }
      break;
    }

    case 'nebula-particle-drift': {
      // 4. Ambient Nebula Particles & Bokeh
      while (ambientDust.length < 50) {
        ambientDust.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 20,
          vy: -15 - Math.random() * 25,
          size: 2 + Math.random() * 6,
          alpha: 0.2 + Math.random() * 0.6
        });
      }

      const speedMult = 1 + metrics.treble * 2.0;

      for (let i = 0; i < ambientDust.length; i++) {
        const p = ambientDust[i];
        p.x += p.vx * deltaTime * speedMult;
        p.y += p.vy * deltaTime * speedMult;

        if (p.y < -10) { p.y = height + 10; p.x = Math.random() * width; }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        const pRadius = p.size * (1 + metrics.bass * 0.5);
        const colIdx = Math.min(255, Math.floor(120 + (i % 80)));
        const pColor = colorLut[colIdx];

        ctx.fillStyle = pColor;
        ctx.globalAlpha = opacity * p.alpha * (0.4 + metrics.rms * 0.6);
        ctx.beginPath();
        ctx.arc(p.x, p.y, pRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case 'audio-reactive-waves': {
      // 5. Undulating Harmonic Gradient Mesh Waves
      wavePhase += (0.8 + metrics.mid * 2.5) * deltaTime;
      const numWaves = 4;

      for (let w = 0; w < numWaves; w++) {
        const waveY = height * 0.3 + (w / numWaves) * (height * 0.5);
        const colIdx = Math.min(255, Math.floor((w / numWaves) * 200 + 40));
        const waveColor = colorLut[colIdx];

        ctx.fillStyle = waveColor;
        ctx.globalAlpha = opacity * (0.08 + (w / numWaves) * 0.08 * (1 + metrics.bass));

        ctx.beginPath();
        ctx.moveTo(0, height);

        for (let x = 0; x <= width; x += 15) {
          const normX = x / width;
          const sine = Math.sin(normX * Math.PI * 3 + wavePhase + w * 1.2);
          const freqOffset = Math.sin(normX * Math.PI * 6 - wavePhase * 0.5) * (15 + metrics.bass * 30);
          const y = waveY + sine * 35 + freqOffset;

          if (x === 0) ctx.lineTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }

    case 'deep-slate':
    default: {
      // Minimal studio background with quiet subtle breathing glow
      const cx = width / 2;
      const cy = height / 2;
      const auraR = Math.min(width, height) * (0.4 + metrics.bass * 0.2);

      const grad = ctx.createRadialGradient(cx, cy, 10, cx, cy, auraR);
      grad.addColorStop(0, colorLut[Math.min(255, Math.floor(40 + metrics.bass * 60))]);
      grad.addColorStop(1, '#0a0a0c');

      ctx.globalAlpha = opacity * 0.35;
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      break;
    }
  }

  ctx.restore();
}
