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
    y: phone ? 168 : 250,
  };
}

export function menuZoom(phone) {
  return 1 + (phone ? 0.18 : 0.42);
}

export function menuHits(phone) {
  const title = titleAnchor(phone);
  const startY = title.y + (phone ? 72 : 92);
  const gap = phone ? 52 : 58;
  const w = phone ? 210 : 260;
  const h = phone ? 42 : 48;
  return menuChoices().map((choice, index) => ({
    ...choice,
    index,
    x: title.x - w / 2,
    y: startY + index * gap - h / 2,
    w,
    h,
  }));
}

export function levelHits(phone) {
  const title = titleAnchor(phone);
  const cols = phone ? 2 : 5;
  const rows = Math.ceil(LEVELS.length / cols);
  const cellW = phone ? 110 : 96;
  const cellH = phone ? 52 : 54;
  const gapX = phone ? 12 : 12;
  const gapY = phone ? 10 : 10;
  const gridW = cols * cellW + (cols - 1) * gapX;
  const startX = title.x - gridW / 2;
  const startY = title.y + (phone ? 48 : 56);
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
    x: title.x - (phone ? 70 : 80),
    y: startY + rows * (cellH + gapY) + (phone ? 4 : 6),
    w: phone ? 140 : 160,
    h: phone ? 32 : 34,
  }]);
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
