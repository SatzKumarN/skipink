import { COLOR, DRESSES, MARKER } from '../config.js';

export function drawWoodGrain(ctx, width, height) {
  ctx.save();
  ctx.strokeStyle = '#c9b596';
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = 0.28;
  const count = 16;
  const step = Math.max(20, height / count);
  for (let i = 0; i < count; i += 1) {
    const y = i * step + 10;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(
      width * 0.3,
      y + Math.sin(i * 1.3) * 14,
      width * 0.7,
      y - Math.cos(i * 1.7) * 12,
      width,
      y + Math.sin(i * 0.9) * 8,
    );
    ctx.stroke();
  }
  ctx.restore();
}

export function drawCoffeeRing(ctx, x, y, r) {
  ctx.save();
  ctx.strokeStyle = '#947050';
  ctx.lineWidth = 2.4;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  const steps = 32;
  for (let i = 0; i <= steps; i += 1) {
    const a = (i / steps) * Math.PI * 2;
    const wobble = 1 + Math.sin(i * 3.7) * 0.05 + Math.cos(i * 7.1) * 0.03;
    const px = x + Math.cos(a) * r * wobble;
    const py = y + Math.sin(a) * r * wobble * 0.92;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();

  // Faint inner rim
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = 0.1;
  ctx.beginPath();
  for (let i = 0; i <= steps; i += 1) {
    const a = (i / steps) * Math.PI * 2;
    const px = x + Math.cos(a) * (r - 4);
    const py = y + Math.sin(a) * (r - 4) * 0.92;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

export function drawDraftingPencil(ctx, x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Dimensions: 140px long, 14px thick
  const len = 140;
  const thick = 14;
  const half = thick / 2;

  // Pencil body (yellow)
  ctx.fillStyle = '#e5a83b';
  ctx.fillRect(0, -half, len - 34, thick);

  // Pencil facet shade line
  ctx.fillStyle = '#c88c22';
  ctx.fillRect(0, -half, len - 34, 4);

  // Brass ferrule
  ctx.fillStyle = '#b7a26f';
  ctx.fillRect(-18, -half, 18, thick);
  ctx.strokeStyle = '#7a6638';
  ctx.lineWidth = 1;
  ctx.strokeRect(-18, -half, 18, thick);

  // Pink eraser
  ctx.fillStyle = '#d98282';
  ctx.beginPath();
  ctx.roundRect(-28, -half + 1, 10, thick - 2, [3, 0, 0, 3]);
  ctx.fill();

  // Sharpened wood cone
  const coneStart = len - 34;
  ctx.fillStyle = '#f0d3a5';
  ctx.beginPath();
  ctx.moveTo(coneStart, -half);
  ctx.lineTo(len - 10, -2);
  ctx.lineTo(len - 10, 2);
  ctx.lineTo(coneStart, half);
  ctx.closePath();
  ctx.fill();

  // Graphite tip
  ctx.fillStyle = COLOR.ink;
  ctx.beginPath();
  ctx.moveTo(len - 10, -2);
  ctx.lineTo(len, 0);
  ctx.lineTo(len - 10, 2);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

export function drawEraserShavings(ctx, x, y) {
  ctx.save();
  ctx.strokeStyle = '#c47d7d';
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.55;
  const offsets = [
    [0, 0, 0.4],
    [8, -5, 1.1],
    [-6, 7, -0.6],
    [14, 4, 2.2],
  ];
  offsets.forEach(([dx, dy, rot]) => {
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, 4.5, rot, rot + Math.PI * 0.9);
    ctx.stroke();
  });
  ctx.restore();
}

export function drawPaperClip(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = '#9e9180';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 36);
  ctx.lineTo(0, 10);
  ctx.arc(6, 10, 6, Math.PI, 0);
  ctx.lineTo(12, 42);
  ctx.arc(17, 42, 5, Math.PI, 0, true);
  ctx.lineTo(22, 16);
  ctx.arc(26, 16, 4, Math.PI, 0);
  ctx.lineTo(30, 30);
  ctx.stroke();
  ctx.restore();
}

export function drawColorPalette(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = 0.7;
  DRESSES.forEach((dress, idx) => {
    ctx.fillStyle = dress.skirt;
    ctx.beginPath();
    const px = (idx % 3) * 16;
    const py = Math.floor(idx / 3) * 16;
    ctx.arc(px, py, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = dress.deep;
    ctx.beginPath();
    ctx.arc(px - 1, py - 1, 2.2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

export function drawDeskLighting(ctx, width, height) {
  ctx.save();
  const grad = ctx.createRadialGradient?.(
    width * 0.45,
    height * 0.35,
    Math.min(width, height) * 0.25,
    width * 0.5,
    height * 0.5,
    Math.max(width, height) * 0.85,
  );
  if (grad && typeof grad.addColorStop === 'function') {
    grad.addColorStop(0, 'rgba(255, 252, 240, 0.08)');
    grad.addColorStop(0.65, 'rgba(0, 0, 0, 0)');
    grad.addColorStop(1, 'rgba(40, 25, 15, 0.18)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.restore();
}
