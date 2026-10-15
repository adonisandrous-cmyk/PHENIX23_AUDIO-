import { AudioMetrics, VisualizerSettings } from '../../types/visualizer';

interface Star {
  x: number;
  y: number;
  z: number;
  speed: number;
}

const stars: Star[] = [];
let tunnelRotation = 0;
const RING_DEPTHS = [0.15, 0.25, 0.38, 0.55, 0.75, 1.0, 1.35, 1.8];

export function renderWarpTunnel(
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
  const maxDim = Math.max(width, height);

  // Initialize stars
  while (stars.length < 80) {
    stars.push({
      x: (Math.random() - 0.5) * width * 1.5,
      y: (Math.random() - 0.5) * height * 1.5,
      z: Math.random() * 1000 + 100,
      speed: 300 + Math.random() * 500
    });
  }

  // Update tunnel rotation & forward velocity
  const warpMultiplier = 1.0 + metrics.bass * 2.5;
  tunnelRotation += (0.4 + metrics.treble * 0.8) * deltaTime;

  // 1. Render hyperspace stars
  ctx.save();
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    s.z -= s.speed * warpMultiplier * deltaTime;

    if (s.z <= 10) {
      s.z = 1000;
      s.x = (Math.random() - 0.5) * width * 1.5;
      s.y = (Math.random() - 0.5) * height * 1.5;
    }

    const k = 400 / s.z;
    const px = cx + s.x * k;
    const py = cy + s.y * k;

    // Streak tail towards center
    const tailK = 400 / (s.z + 40 * warpMultiplier);
    const tailX = cx + s.x * tailK;
    const tailY = cy + s.y * tailK;

    const alpha = Math.min(1.0, (1000 - s.z) / 500);
    const color = colorLut[Math.min(255, Math.floor(180 + (i % 75)))];

    ctx.strokeStyle = color;
    ctx.lineWidth = Math.max(1, 2.5 * k);
    ctx.globalAlpha = alpha;

    ctx.beginPath();
    ctx.moveTo(tailX, tailY);
    ctx.lineTo(px, py);
    ctx.stroke();
  }
  ctx.restore();

  // 2. Render concentric polygonal tunnel rings
  const polySides = 8; // Octagonal tunnel
  for (let r = 0; r < RING_DEPTHS.length; r++) {
    const depth = RING_DEPTHS[r];
    const ringRadius = (maxDim * 0.45) * depth * (1 + metrics.bass * 0.2);
    const ringRot = tunnelRotation * (1 + r * 0.15) * ((r % 2 === 0) ? 1 : -1);

    const colorIdx = Math.min(255, Math.floor((r / RING_DEPTHS.length) * 220 + 35));
    const ringColor = colorLut[colorIdx];

    ctx.save();
    ctx.strokeStyle = ringColor;
    ctx.lineWidth = Math.max(1.5, 3.5 * depth);
    ctx.globalAlpha = Math.min(1.0, 0.2 + depth * 0.8);

    if (settings.glowIntensity > 0) {
      ctx.shadowColor = ringColor;
      ctx.shadowBlur = 8 * depth * settings.glowIntensity;
    }

    ctx.beginPath();
    for (let p = 0; p <= polySides; p++) {
      const angle = (p / polySides) * Math.PI * 2 + ringRot;
      
      // Frequency distortion per vertex
      const fIdx = Math.floor((p / polySides) * (freqData.length * 0.5));
      const fVal = ((freqData[fIdx] || 0) / 255) * settings.sensitivity;
      const vertexR = ringRadius * (1 + fVal * 0.25);

      const vx = cx + Math.cos(angle) * vertexR;
      const vy = cy + Math.sin(angle) * vertexR;

      if (p === 0) ctx.moveTo(vx, vy);
      else ctx.lineTo(vx, vy);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}
