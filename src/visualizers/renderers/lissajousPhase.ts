import { AudioMetrics, VisualizerSettings } from '../../types/visualizer';

export function renderLissajousPhase(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  leftTimeData: Uint8Array,
  rightTimeData: Uint8Array,
  metrics: AudioMetrics,
  settings: VisualizerSettings,
  colorLut: string[]
) {
  const cx = width / 2;
  const cy = height / 2;
  const scopeRadius = Math.min(width, height) * 0.4;

  // 1. Draw oscilloscope circular graticule / reticle
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;

  // Outer bezel ring
  ctx.beginPath();
  ctx.arc(cx, cy, scopeRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Inner rings
  ctx.beginPath();
  ctx.arc(cx, cy, scopeRadius * 0.66, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, scopeRadius * 0.33, 0, Math.PI * 2);
  ctx.stroke();

  // 45-degree stereo crosshairs (M/S axis)
  // Vertical = Mid (In-phase mono), Horizontal = Side (Stereo difference)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.setLineDash([4, 4]);

  // Center vertical (M)
  ctx.beginPath();
  ctx.moveTo(cx, cy - scopeRadius);
  ctx.lineTo(cx, cy + scopeRadius);
  ctx.stroke();

  // Center horizontal (S)
  ctx.beginPath();
  ctx.moveTo(cx - scopeRadius, cy);
  ctx.lineTo(cx + scopeRadius, cy);
  ctx.stroke();

  // L and R 45-degree diagonals
  const diagOffset = scopeRadius * Math.SQRT1_2;
  ctx.beginPath();
  ctx.moveTo(cx - diagOffset, cy - diagOffset);
  ctx.lineTo(cx + diagOffset, cy + diagOffset);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - diagOffset, cy + diagOffset);
  ctx.lineTo(cx + diagOffset, cy - diagOffset);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.restore();

  // 2. Plot Goniometer Lissajous Beam:
  // For each stereo sample:
  // L and R are normalized between -1.0 and 1.0
  // Standard Goniometer 45-degree rotation:
  // X = (L - R) * cos(45°) = (L - R) * 0.7071
  // Y = (L + R) * sin(45°) = (L + R) * 0.7071
  const len = Math.min(leftTimeData.length, rightTimeData.length);
  const step = Math.max(1, Math.floor(len / 380));

  const beamColor = colorLut[Math.min(255, Math.floor(180 + metrics.peak * 75))];

  ctx.save();
  ctx.strokeStyle = beamColor;
  ctx.lineWidth = 1.8;

  if (settings.glowIntensity > 0) {
    ctx.shadowColor = beamColor;
    ctx.shadowBlur = 8 * settings.glowIntensity;
  }

  ctx.beginPath();
  let hasMoved = false;

  for (let i = 0; i < len; i += step) {
    const l = ((leftTimeData[i] || 128) - 128) / 128;
    const r = ((rightTimeData[i] || 128) - 128) / 128;

    // Goniometer coordinates (rotated 45 deg, Y inverted)
    const side = (l - r) * Math.SQRT1_2;
    const mid = (l + r) * Math.SQRT1_2;

    const px = cx + side * scopeRadius * settings.sensitivity * 1.25;
    const py = cy - mid * scopeRadius * settings.sensitivity * 1.25;

    if (!hasMoved) {
      ctx.moveTo(px, py);
      hasMoved = true;
    } else {
      ctx.lineTo(px, py);
    }
  }

  ctx.stroke();
  ctx.restore();

  // 3. Draw Phase Correlation Bar at bottom
  // Calculate instantaneous correlation: sum(L*R) / (sqrt(sum(L^2)) * sqrt(sum(R^2)))
  let dotSum = 0;
  let lSum = 0;
  let rSum = 0;
  for (let i = 0; i < len; i += 4) {
    const l = ((leftTimeData[i] || 128) - 128) / 128;
    const r = ((rightTimeData[i] || 128) - 128) / 128;
    dotSum += l * r;
    lSum += l * l;
    rSum += r * r;
  }
  const denom = Math.sqrt(lSum) * Math.sqrt(rSum);
  const correlation = denom > 0.0001 ? Math.max(-1, Math.min(1, dotSum / denom)) : 1.0;

  // Render correlation meter
  const meterW = scopeRadius * 1.2;
  const meterH = 6;
  const meterX = cx - meterW / 2;
  const meterY = cy + scopeRadius + 22;

  // Background
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillRect(meterX, meterY, meterW, meterH);

  // Center mark
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fillRect(cx - 1, meterY - 3, 2, meterH + 6);

  // Correlation indicator needle
  const needleX = cx + (correlation * (meterW / 2));
  const corrColor = correlation >= 0 ? colorLut[200] : '#ef4444';
  ctx.fillStyle = corrColor;
  ctx.fillRect(needleX - 2, meterY - 2, 4, meterH + 4);

  // Text labels
  ctx.font = '10px "JetBrains Mono", monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fillText('-1', meterX - 16, meterY + 7);
  ctx.fillText('+1', meterX + meterW + 6, meterY + 7);
  ctx.fillText(`PHASE: ${correlation >= 0 ? '+' : ''}${correlation.toFixed(2)}`, cx - 35, meterY + 22);
}
