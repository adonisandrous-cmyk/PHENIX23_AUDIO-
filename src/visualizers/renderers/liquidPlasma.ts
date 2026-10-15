import { AudioMetrics, VisualizerSettings } from '../../types/visualizer';

let plasmaPhase = 0;

export function renderLiquidPlasma(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  freqData: Uint8Array,
  metrics: AudioMetrics,
  settings: VisualizerSettings,
  colorLut: string[],
  deltaTime: number
) {
  const cx = width / 2;
  const cy = height / 2;
  const minDim = Math.min(width, height);

  // Phase evolution driven by audio energy
  plasmaPhase += (0.8 + metrics.bass * 2.2 + metrics.rms * 1.5) * deltaTime;

  // Render multi-layered fluid contour rings
  const ringCount = 8;
  const baseR = minDim * 0.12 * (1 + metrics.bass * 0.4);

  for (let r = 0; r < ringCount; r++) {
    const ringRadius = baseR + (r / ringCount) * (minDim * 0.38);
    const wavePoints = 48;
    const colorIdx = Math.min(255, Math.floor((r / ringCount) * 200 + metrics.mid * 55));
    const ringColor = colorLut[colorIdx];

    ctx.save();
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = 2 + (r % 2) * 1.5;
    ctx.globalAlpha = Math.max(0.15, 1.0 - (r / ringCount) * 0.75);

    if (settings.glowIntensity > 0) {
      ctx.shadowColor = ringColor;
      ctx.shadowBlur = (6 + r * 2) * settings.glowIntensity;
    }

    ctx.beginPath();

    for (let p = 0; p <= wavePoints; p++) {
      const angle = (p / wavePoints) * Math.PI * 2;
      
      // Frequency sampling corresponding to angle
      const freqIdx = Math.floor(Math.abs(Math.sin(angle * 2)) * (freqData.length * 0.5));
      const freqVal = (freqData[Math.min(freqData.length - 1, freqIdx)] || 0) / 255;

      // Complex fluid harmonic wave equation
      const wave1 = Math.sin(angle * 4 + plasmaPhase + r * 0.6) * (15 + metrics.bass * 30);
      const wave2 = Math.cos(angle * 7 - plasmaPhase * 0.8) * (8 + metrics.treble * 20);
      const audioDisplacement = freqVal * (minDim * 0.12) * settings.sensitivity;

      const currentRadius = ringRadius + wave1 + wave2 + audioDisplacement;
      const px = cx + Math.cos(angle) * currentRadius;
      const py = cy + Math.sin(angle) * currentRadius;

      if (p === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }

    ctx.closePath();
    ctx.stroke();

    // Subtle fluid fill for inner rings
    if (r <= 2) {
      ctx.fillStyle = ringColor;
      ctx.globalAlpha = 0.08 * (1 + metrics.bass);
      ctx.fill();
    }

    ctx.restore();
  }

  // Center incandescent liquid singularity
  const singGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, baseR * 0.85);
  singGrad.addColorStop(0, colorLut[255]);
  singGrad.addColorStop(0.4, colorLut[180]);
  singGrad.addColorStop(1, 'transparent');

  ctx.save();
  ctx.fillStyle = singGrad;
  if (settings.glowIntensity > 0) {
    ctx.shadowColor = colorLut[220];
    ctx.shadowBlur = 24 * settings.glowIntensity;
  }
  ctx.beginPath();
  ctx.arc(cx, cy, baseR * 0.85, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
