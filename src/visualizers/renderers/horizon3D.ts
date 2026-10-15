import { AudioMetrics, VisualizerSettings } from '../../types/visualizer';

const historyRows: Float32Array[] = [];
const NUM_ROWS = 24;
const COLS = 48;
let zOffset = 0;

export function renderHorizon3D(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  freqData: Uint8Array,
  metrics: AudioMetrics,
  settings: VisualizerSettings,
  colorLut: string[],
  deltaTime: number
) {
  // Horizon and vanishing point geometry
  const horizonY = height * 0.42;
  const cx = width / 2;

  // Initialize history rows if not populated
  while (historyRows.length < NUM_ROWS) {
    historyRows.push(new Float32Array(COLS));
  }

  // Scroll terrain forward based on beat velocity
  const speed = (12 + metrics.bass * 24) * deltaTime;
  zOffset += speed;

  if (zOffset >= 1.0) {
    zOffset %= 1.0;
    // Pop oldest row and push fresh audio spectrum sample to front
    const newRow = historyRows.pop()!;
    for (let c = 0; c < COLS; c++) {
      // Center symmetrical distribution
      const normC = Math.abs(c - (COLS - 1) / 2) / ((COLS - 1) / 2);
      const dataIdx = Math.floor(Math.pow(1 - normC, 1.3) * (freqData.length * 0.6));
      const val = (freqData[Math.min(freqData.length - 1, dataIdx)] || 0) / 255;
      newRow[c] = val * settings.sensitivity * (1 - normC * 0.3);
    }
    historyRows.unshift(newRow);
  }

  // 1. Draw glowing retro synthwave sun at horizon
  const sunRadius = Math.min(width, height) * 0.16;
  const sunGrad = ctx.createLinearGradient(0, horizonY - sunRadius, 0, horizonY);
  sunGrad.addColorStop(0, colorLut[240]);
  sunGrad.addColorStop(0.7, colorLut[140]);
  sunGrad.addColorStop(1, 'transparent');

  ctx.save();
  ctx.fillStyle = sunGrad;
  if (settings.glowIntensity > 0) {
    ctx.shadowColor = colorLut[200];
    ctx.shadowBlur = 25 * settings.glowIntensity;
  }
  ctx.beginPath();
  ctx.arc(cx, horizonY, sunRadius, Math.PI, 0, false);
  ctx.fill();
  ctx.restore();

  // Draw sun horizon blinds (retro neon slats)
  ctx.fillStyle = '#0a0a0c';
  for (let s = 1; s <= 6; s++) {
    const slatY = horizonY - sunRadius * (s / 7);
    const slatH = 2 + s * 0.8;
    ctx.fillRect(cx - sunRadius, slatY, sunRadius * 2, slatH);
  }

  // 2. Project 3D grid points
  // Perspective projection: screenX = cx + (worldX) / z, screenY = horizonY + (worldY) / z
  const gridPoints: { x: number; y: number; heightVal: number }[][] = [];

  for (let r = 0; r < NUM_ROWS; r++) {
    const rowPoints: { x: number; y: number; heightVal: number }[] = [];
    const z = (r + 1 - zOffset) * 0.45;
    const projY = horizonY + (height - horizonY) * Math.pow(r / NUM_ROWS, 1.8);
    const spreadWidth = width * (1.2 + (r / NUM_ROWS) * 2.2);

    const rowData = historyRows[r] || historyRows[0];

    for (let c = 0; c < COLS; c++) {
      const normX = (c / (COLS - 1) - 0.5) * spreadWidth;
      const hVal = rowData[c];
      const elev = hVal * (height * 0.32) * Math.pow(r / NUM_ROWS, 1.4);
      const px = cx + normX;
      const py = projY - elev;

      rowPoints.push({ x: px, y: py, heightVal: hVal });
    }
    gridPoints.push(rowPoints);
  }

  // 3. Render horizontal terrain lines
  for (let r = 0; r < NUM_ROWS - 1; r++) {
    const pts = gridPoints[r];
    const colorIdx = Math.min(255, Math.floor((r / NUM_ROWS) * 220 + 35));
    const lineColor = colorLut[colorIdx];

    ctx.strokeStyle = lineColor;
    ctx.lineWidth = Math.max(1, 1 + (r / NUM_ROWS) * 1.5);
    ctx.globalAlpha = Math.min(1.0, 0.2 + (r / NUM_ROWS) * 0.8);

    ctx.beginPath();
    for (let c = 0; c < COLS; c++) {
      const p = pts[c];
      if (c === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
  }

  // 4. Render longitudinal perspective lines
  ctx.lineWidth = 1;
  const colStep = 2; // Every 2 columns for clean wireframe density
  for (let c = 0; c < COLS; c += colStep) {
    ctx.beginPath();
    for (let r = 0; r < NUM_ROWS; r++) {
      const p = gridPoints[r][c];
      if (r === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    const colorIdx = Math.min(255, Math.floor(100 + (c / COLS) * 120));
    ctx.strokeStyle = colorLut[colorIdx];
    ctx.globalAlpha = 0.45;
    ctx.stroke();
  }

  ctx.globalAlpha = 1.0;
  ctx.shadowBlur = 0;
}
