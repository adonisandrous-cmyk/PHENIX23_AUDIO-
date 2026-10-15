import { AudioMetrics, VisualizerSettings } from '../../types/visualizer';

interface Particle {
  angle: number;
  distance: number;
  speed: number;
  size: number;
  alpha: number;
  colorIdx: number;
}

let rotation = 0;
const particles: Particle[] = [];

export function renderRadialNebula(
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
  const baseRadius = minDim * 0.18 * (1 + metrics.bass * 0.35);
  const maxBarLength = minDim * 0.28 * settings.sensitivity;

  // Update rotation with rotational inertia + beat boost
  rotation += (0.25 + metrics.bass * 0.8) * deltaTime;

  // Spawn reactive particles on beats or strong bass
  if (metrics.isBeat || (metrics.bass > 0.4 && Math.random() < 0.4)) {
    const burstCount = Math.floor(6 + metrics.bass * 12);
    for (let i = 0; i < burstCount; i++) {
      if (particles.length < (settings.particleCount || 120)) {
        particles.push({
          angle: Math.random() * Math.PI * 2,
          distance: baseRadius * (0.8 + Math.random() * 0.4),
          speed: 120 + Math.random() * 280 * (metrics.bass + 0.5),
          size: 2 + Math.random() * 4,
          alpha: 1.0,
          colorIdx: Math.floor(Math.random() * 255)
        });
      }
    }
  }

  // Update & draw particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.distance += p.speed * deltaTime;
    p.alpha -= deltaTime * 1.2;

    if (p.alpha <= 0 || p.distance > minDim * 0.6) {
      particles.splice(i, 1);
      continue;
    }

    const px = cx + Math.cos(p.angle + rotation * 0.5) * p.distance;
    const py = cy + Math.sin(p.angle + rotation * 0.5) * p.distance;
    const color = colorLut[p.colorIdx] || colorLut[128];

    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = color;
    if (settings.glowIntensity > 0) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 6 * settings.glowIntensity;
    }
    ctx.beginPath();
    ctx.arc(px, py, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Draw pulsating center core
  const coreGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, baseRadius * 0.9);
  coreGrad.addColorStop(0, colorLut[250]);
  coreGrad.addColorStop(0.5, colorLut[160]);
  coreGrad.addColorStop(1, 'rgba(0,0,0,0.4)');

  ctx.save();
  ctx.fillStyle = coreGrad;
  if (settings.glowIntensity > 0) {
    ctx.shadowColor = colorLut[220];
    ctx.shadowBlur = 18 * settings.glowIntensity * (1 + metrics.bass);
  }
  ctx.beginPath();
  ctx.arc(cx, cy, baseRadius * 0.75, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Draw 360-degree radial frequency bars
  const totalRays = 120;
  ctx.lineWidth = Math.max(2, (Math.PI * 2 * baseRadius) / totalRays * 0.7);

  for (let i = 0; i < totalRays; i++) {
    // Mirror frequency mapping for symmetrical organic iris
    const normIdx = i < totalRays / 2 ? i / (totalRays / 2) : (totalRays - i) / (totalRays / 2);
    const dataIdx = Math.floor(Math.pow(normIdx, 1.4) * (freqData.length * 0.65));
    const rawVal = freqData[Math.min(freqData.length - 1, dataIdx)] || 0;
    const val = (rawVal / 255) * settings.sensitivity;

    const angle = (i / totalRays) * Math.PI * 2 + rotation;
    const barLen = Math.max(4, val * maxBarLength);

    const x1 = cx + Math.cos(angle) * baseRadius;
    const y1 = cy + Math.sin(angle) * baseRadius;
    const x2 = cx + Math.cos(angle) * (baseRadius + barLen);
    const y2 = cy + Math.sin(angle) * (baseRadius + barLen);

    const colorIdx = Math.min(255, Math.floor(val * 255));
    const rayColor = colorLut[colorIdx] || colorLut[colorLut.length - 1];

    ctx.strokeStyle = rayColor;
    if (settings.glowIntensity > 0) {
      ctx.shadowColor = rayColor;
      ctx.shadowBlur = 4 * settings.glowIntensity;
    }

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  // Outer harmonic ripple ring
  ctx.shadowBlur = 0;
  ctx.strokeStyle = colorLut[180];
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.35 + metrics.mid * 0.45;
  ctx.beginPath();
  ctx.arc(cx, cy, baseRadius + maxBarLength * 0.45 * (1 + metrics.treble * 0.3), 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1.0;
}
