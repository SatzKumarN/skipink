import { LEVELS, PAGE } from '../config.js';

export function menuChoices() {
  return [
    { id: 'infinity', label: 'infinity' },
    { id: 'levels', label: 'levels' },
  ];
}

export function titleAnchor(phone) {
  return {
    x: phone ? 500 : 480,
    y: phone ? 100 : 236,
  };
}

export function menuZoom(phone) {
  return 1 + (phone ? 0.06 : 0.28);
}

export function menuHits(phone) {
  const title = titleAnchor(phone);
  const w = phone ? 124 : 156;
  const h = phone ? 112 : 140;
  const gap = phone ? 16 : 28;
  const startY = title.y + (phone ? 24 : 36);
  const totalW = w * 2 + gap;
  const startX = title.x - totalW / 2;
  return menuChoices().map((choice, index) => ({
    ...choice,
    index,
    x: startX + index * (w + gap),
    y: startY,
    w,
    h,
  }));
}

export function levelHits(phone) {
  const title = titleAnchor(phone);
  const cols = phone ? 2 : 5;
  const rows = Math.ceil(LEVELS.length / cols);
  const cellW = phone ? 90 : 86;
  const cellH = phone ? 54 : 70;
  const gapX = phone ? 10 : 10;
  const gapY = phone ? 2 : 4;
  const gridW = cols * cellW + (cols - 1) * gapX;
  const startX = title.x - gridW / 2;
  const startY = title.y + (phone ? 18 : 36);
  return LEVELS.map((level, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    return {
      id: `level-${level.id}`,
      level: level.id,
      goal: level.goal,
      label: String(level.id),
      index,
      x: startX + col * (cellW + gapX),
      y: startY + row * (cellH + gapY),
      w: cellW,
      h: cellH,
    };
  }).concat([{
    id: 'back',
    label: 'back',
    index: LEVELS.length,
    x: title.x - (phone ? 44 : 50),
    y: startY + rows * (cellH + gapY),
    w: phone ? 88 : 100,
    h: phone ? 42 : 52,
  }]);
}

export function exitHit(phone) {
  const title = titleAnchor(phone);
  return {
    id: 'back',
    label: 'back',
    index: 0,
    x: title.x - (phone ? 136 : 168),
    y: title.y + (phone ? 36 : 44),
    w: phone ? 88 : 100,
    h: phone ? 56 : 64,
  };
}

export function pointInHit(hit, x, y) {
  if (!hit) return false;
  return x >= hit.x && x <= hit.x + hit.w && y >= hit.y && y <= hit.y + hit.h;
}

export function hitAt(hits, x, y) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return hits.find((hit) => pointInHit(hit, x, y)) || null;
}

export function pageFromScreen(screenX, screenY, cam, focus, zoom) {
  const lx = (screenX - cam.ox) / cam.s;
  const ly = (screenY - cam.oy) / cam.s;
  return {
    x: (lx - PAGE.w / 2) / zoom + focus.x,
    y: (ly - PAGE.h / 2) / zoom + focus.y,
  };
}
