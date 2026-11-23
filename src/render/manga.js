import { COLOR, FIGURE, MARKER } from '../config.js';

const MANGA_WORDS = [
  { text: 'HOP!', sub: 'ぴょん!' },
  { text: 'SWOOSH!', sub: 'シュッ!' },
  { text: 'NICE!', sub: 'ナイス!' },
  { text: 'CLEAN!', sub: 'スッ!' },
  { text: 'PERFECT!', sub: '完璧!' },
  { text: 'FEVER!!', sub: '熱い!' },
];

export function selectSfx(score, streak, mood) {
  if (streak >= 15) return MANGA_WORDS[5]; // FEVER!
  if (streak >= 8) return MANGA_WORDS[4]; // PERFECT!
  if (streak >= 4) return MANGA_WORDS[2]; // NICE!
  if (mood === 'snap') return MANGA_WORDS[1]; // SWOOSH!
  if (mood === 'hurry') return MANGA_WORDS[3]; // CLEAN!
  return MANGA_WORDS[score % 2]; // HOP! or SWOOSH!
}

export function drawMangaSfx(ctx, vm) {
  if (!vm.enhanced || !(vm.fleck > 0) || vm.phase !== 'playing') return;
  const t = 1 - vm.fleck; // 0 (start) to 1 (decayed)
  const sfx = selectSfx(vm.score, vm.streak || 0, vm.mood);
  const x = FIGURE.x + (vm.score % 2 === 0 ? 65 : -65) + (vm.score % 2 === 0 ? t * 14 : -t * 14);
  const y = FIGURE.ground - vm.lift * 46 - 80 - t * 24;

  ctx.save();
  ctx.globalAlpha = vm.fleck;
  ctx.translate(x, y);
  ctx.rotate(vm.score % 2 === 0 ? 0.16 : -0.16);

  // Manga burst background bubble / speed spikes
  ctx.fillStyle = MARKER.gold;
  ctx.beginPath();
  const spikes = 8;
  const outerR = 36 + (1 - t) * 8;
  const innerR = 24;
  for (let i = 0; i < spikes * 2; i += 1) {
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r * 0.7;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = COLOR.ink;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Primary bold comic text
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 20px "Caveat Brush", Impact, sans-serif';

  // Black offset shadow
  ctx.fillStyle = COLOR.ink;
  ctx.fillText(sfx.text, 1.8, 1.8);

  // Vibrant foreground fill
  ctx.fillStyle = COLOR.cinnabar;
  ctx.fillText(sfx.text, 0, 0);

  // Japanese kana subtitle underneath
  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = COLOR.ink;
  ctx.fillText(sfx.sub, 0, 16);

  ctx.restore();
}

export function drawFocusLines(ctx, width, height, vm) {
  if (!vm.enhanced || vm.phase !== 'playing' || (vm.streak || 0) < 6) return;
  const streak = vm.streak;
  const intensity = Math.min(1, (streak - 5) / 10);
  const cx = FIGURE.x;
  const cy = FIGURE.ground - vm.lift * 46 - 40;
  const clock = vm.clock || 0;

  ctx.save();
  ctx.strokeStyle = COLOR.ink;
  ctx.lineWidth = 1.6;
  ctx.globalAlpha = intensity * 0.22;

  const count = 28;
  const safeRadius = 90;
  const maxRadius = Math.max(width, height) * 0.9;

  for (let i = 0; i < count; i += 1) {
    const angle = (i / count) * Math.PI * 2 + Math.sin(clock * 6 + i) * 0.05;
    // Only draw lines pointing towards the center from screen edges
    const inner = safeRadius + (Math.sin(clock * 12 + i * 3) * 0.5 + 0.5) * 45;
    const x0 = cx + Math.cos(angle) * inner;
    const y0 = cy + Math.sin(angle) * inner * 0.8;
    const x1 = cx + Math.cos(angle) * maxRadius;
    const y1 = cy + Math.sin(angle) * maxRadius;

    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawImpactShockwave(ctx, vm) {
  if (!vm.enhanced || !(vm.landDust > 0)) return;
  const t = 1 - vm.landDust;
  const gx = FIGURE.x;
  const gy = FIGURE.ground + 14;

  ctx.save();
  ctx.globalAlpha = vm.landDust * 0.7;
  ctx.strokeStyle = COLOR.ink;
  ctx.lineWidth = 2.2;

  // Expanding shockwave ring
  const rx = 24 + t * 45;
  const ry = 8 + t * 14;
  ctx.beginPath();
  ctx.ellipse(gx, gy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Manga impact action lines (small radial tick marks)
  ctx.lineWidth = 1.5;
  const ticks = 10;
  for (let i = 0; i < ticks; i += 1) {
    const a = (i / ticks) * Math.PI * 2;
    const x0 = gx + Math.cos(a) * (rx - 4);
    const y0 = gy + Math.sin(a) * (ry - 2);
    const x1 = gx + Math.cos(a) * (rx + 8);
    const y1 = gy + Math.sin(a) * (ry + 5);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawMangaEmotes(ctx, vm) {
  if (!vm.enhanced || vm.phase !== 'playing') return;
  const fy = FIGURE.ground - vm.lift * 46;
  const hx = FIGURE.x;
  const hy = fy - 95;

  ctx.save();
  // 1. Sweatdrop when rhythm is frantic (hurry mood)
  if (vm.mood === 'hurry') {
    const sweatX = hx + 18;
    const sweatY = hy - 4;
    ctx.fillStyle = '#4ea1d3';
    ctx.strokeStyle = COLOR.ink;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(sweatX, sweatY);
    ctx.quadraticCurveTo(sweatX - 5, sweatY + 7, sweatX, sweatY + 11);
    ctx.quadraticCurveTo(sweatX + 5, sweatY + 7, sweatX, sweatY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // 2. Manga popping vein mark (snap mood)
  if (vm.mood === 'snap') {
    const vx = hx - 20;
    const vy = hy - 6;
    ctx.strokeStyle = COLOR.cinnabar;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(vx - 4, vy - 4, 5, 0, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(vx + 4, vy - 4, 5, Math.PI / 2, Math.PI);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(vx + 4, vy + 4, 5, Math.PI, (Math.PI * 3) / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(vx - 4, vy + 4, 5, (Math.PI * 3) / 2, Math.PI * 2);
    ctx.stroke();
  }

  // 3. Manga sparkle stars when on a high streak
  if ((vm.streak || 0) >= 8) {
    const clock = vm.clock || 0;
    [-24, 24].forEach((ox, idx) => {
      const sparkleX = hx + ox + Math.sin(clock * 3 + idx) * 4;
      const sparkleY = hy - 8 + Math.cos(clock * 4 + idx) * 4;
      const r = 5.5 + Math.sin(clock * 8 + idx) * 1.5;

      ctx.fillStyle = MARKER.gold;
      ctx.beginPath();
      ctx.moveTo(sparkleX, sparkleY - r);
      ctx.quadraticCurveTo(sparkleX, sparkleY, sparkleX + r, sparkleY);
      ctx.quadraticCurveTo(sparkleX, sparkleY, sparkleX, sparkleY + r);
      ctx.quadraticCurveTo(sparkleX, sparkleY, sparkleX - r, sparkleY);
      ctx.quadraticCurveTo(sparkleX, sparkleY, sparkleX, sparkleY - r);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = COLOR.ink;
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }
  ctx.restore();
}

export function drawMangaAura(ctx, vm) {
  if (!vm.enhanced || vm.phase !== 'playing' || (vm.streak || 0) < 10) return;
  const clock = vm.clock || 0;
  const cx = FIGURE.x;
  const cy = FIGURE.ground - vm.lift * 46 - 45;
  const intensity = Math.min(1, (vm.streak - 9) / 10);

  ctx.save();
  ctx.globalAlpha = 0.28 * intensity;
  const flameCount = 7;
  for (let i = 0; i < flameCount; i += 1) {
    const a = (i / flameCount) * Math.PI * 2;
    const offset = Math.sin(clock * 6 + i * 2) * 8;
    const fx = cx + Math.cos(a) * (36 + offset);
    const fy = cy + Math.sin(a) * (52 + offset) - Math.abs(Math.sin(clock * 4 + i)) * 14;
    const radius = 12 + Math.sin(clock * 8 + i) * 4;

    ctx.fillStyle = i % 2 === 0 ? MARKER.gold : COLOR.cinnabar;
    ctx.beginPath();
    ctx.arc(fx, fy, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawMangaCrash(ctx, vm) {
  if (!vm.enhanced || !(vm.blot > 0) || vm.phase === 'cleared' || vm.won) return;
  const t = Math.min(1, vm.blot / 0.5);
  const ox = FIGURE.x;
  const oy = FIGURE.ground - vm.lift * 46 - 68;

  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - vm.blot * 1.2);
  ctx.translate(ox, oy - 20 - t * 15);

  ctx.fillStyle = COLOR.cinnabar;
  ctx.beginPath();
  const spikes = 12;
  const outerR = 54 + (1 - t) * 12;
  const innerR = 32;
  for (let i = 0; i < spikes * 2; i += 1) {
    const a = (i / (spikes * 2)) * Math.PI * 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r * 0.75;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = COLOR.ink;
  ctx.lineWidth = 2.4;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 24px "Caveat Brush", Impact, sans-serif';
  ctx.fillStyle = COLOR.ink;
  ctx.fillText('CRASH!!', 2, 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('CRASH!!', 0, 0);

  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = MARKER.gold;
  ctx.fillText('ドカンッ!!', 0, 18);

  ctx.restore();
}
