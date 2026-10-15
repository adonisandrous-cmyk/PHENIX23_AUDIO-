import { AudioMetrics, VisualizerSettings } from '../../types/visualizer';

interface PeakState {
  value: number;
  lastPeakTime: number;
  velocity: number;
}

const peaks: PeakState[] = [];
const smoothedHeights: number[] = [];

export function renderClassicSpectrum(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  freqData: Uint8Array,
  leftFreqData: Uint8Array,
  rightFreqData: Uint8Array,
  metrics: AudioMetrics,
  settings: VisualizerSettings,
  colorLut: string[],
  now: number,
  deltaTime: number
) {
  const isStereo = settings.stereoMode === 'stereo';
  const numBars = 64;
  const barGap = settings.barGap;
  const usableHeight = settings.showFloorReflection ? height * 0.62 : height * 0.88;
  const baseY = usableHeight;

  // Initialize or resize peak states
  while (peaks.length < numBars) {
    peaks.push({ value: 0, lastPeakTime: 0, velocity: 0 });
    smoothedHeights.push(0);
  }

  // Draw background subtle grid lines (AIMP style frequency grid)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  const gridSteps = 6;
  for (let i = 1; i <= gridSteps; i++) {
    const y = (usableHeight / gridSteps) * i;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  const barWidth = Math.max(2, (width - (numBars - 1) * barGap) / numBars);

  for (let i = 0; i < numBars; i++) {
    // Logarithmic frequency distribution calculation
    const logIndex = Math.floor(Math.pow(i / numBars, 1.6) * (freqData.length * 0.75));
    const safeIndex = Math.min(freqData.length - 1, Math.max(0, logIndex));

    let rawVal: number;
    if (isStereo) {
      // Split bars: first half left channel, second half right channel
      if (i < numBars / 2) {
        const leftIdx = Math.floor(Math.pow((numBars / 2 - 1 - i) / (numBars / 2), 1.6) * (leftFreqData.length * 0.75));
        rawVal = leftFreqData[leftIdx] || 0;
      } else {
        const rightIdx = Math.floor(Math.pow((i - numBars / 2) / (numBars / 2), 1.6) * (rightFreqData.length * 0.75));
        rawVal = rightFreqData[rightIdx] || 0;
      }
    } else {
      rawVal = freqData[safeIndex] || 0;
    }

    // Apply pre-amp sensitivity
    const normalized = Math.min(1.0, (rawVal / 255) * settings.sensitivity);
    const targetH = normalized * usableHeight;

    // Smooth height with interpolation
    const smoothRate = 1 - Math.pow(settings.smoothing, 0.5);
    smoothedHeights[i] = smoothedHeights[i] + (targetH - smoothedHeights[i]) * Math.min(1, smoothRate * 25 * deltaTime);

    const h = smoothedHeights[i];
    const x = i * (barWidth + barGap);

    // Peak holding & gravity falloff
    const peak = peaks[i];
    if (h >= peak.value) {
      peak.value = h;
      peak.lastPeakTime = now;
      peak.velocity = 0;
    } else {
      if (now - peak.lastPeakTime > settings.peakHoldMs) {
        peak.velocity += settings.peakGravity * 980 * deltaTime;
        peak.value = Math.max(0, peak.value - peak.velocity * deltaTime);
      }
    }

    if (h > 1) {
      const colorIndex = Math.min(255, Math.floor((h / usableHeight) * 255));
      const barColor = colorLut[colorIndex] || colorLut[colorLut.length - 1];

      // Bar gradient fill
      const grad = ctx.createLinearGradient(0, baseY, 0, baseY - h);
      grad.addColorStop(0, colorLut[Math.min(255, Math.floor(colorIndex * 0.2))]);
      grad.addColorStop(1, barColor);

      // Glow if enabled
      if (settings.glowIntensity > 0) {
        ctx.shadowColor = barColor;
        ctx.shadowBlur = 8 * settings.glowIntensity;
      } else {
        ctx.shadowBlur = 0;
      }

      ctx.fillStyle = grad;
      ctx.fillRect(x, baseY - h, barWidth, h);

      // Floor Reflection
      if (settings.showFloorReflection) {
        const reflGrad = ctx.createLinearGradient(0, baseY, 0, baseY + h * 0.45);
        reflGrad.addColorStop(0, `rgba(255,255,255,0.25)`);
        reflGrad.addColorStop(1, 'transparent');
        
        ctx.save();
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = reflGrad;
        ctx.fillRect(x, baseY + 2, barWidth, h * 0.4);
        ctx.restore();
      }
    }

    // Render floating peak cap
    if (settings.showPeaks && peak.value > 2) {
      const peakY = baseY - peak.value;
      const peakColor = colorLut[Math.min(255, Math.floor((peak.value / usableHeight) * 255))];

      ctx.fillStyle = peakColor;
      if (settings.glowIntensity > 0) {
        ctx.shadowColor = peakColor;
        ctx.shadowBlur = 10 * settings.glowIntensity;
      }
      ctx.fillRect(x, Math.max(2, peakY - 3), barWidth, 3);
    }
  }

  // Reset shadow
  ctx.shadowBlur = 0;
}
