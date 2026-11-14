import { COLOR, FIGURE, PAGE, ROPE } from '../config.js';
import { menuZoom } from '../core/menu.js';
import { camera } from './fit.js';
import backSymbolUrl from '../assets/back-symbol.png';
import charactersSymbolUrl from '../assets/characters-symbol.png';
import infinitySymbolUrl from '../assets/infinity-symbol.png';
import levelsSymbolUrl from '../assets/levels-symbol.png';

const BRUSH = '"Caveat Brush", Georgia, serif';
const PEN = '"Kalam", Georgia, serif';

const PHONE_STAGE = { x: 330, y: 0, w: 340, h: 640 };

const BRUSH_ART = {
  back: { url: backSymbolUrl, image: null, tints: new Map() },
  infinity: { url: infinitySymbolUrl, image: null, tints: new Map() },
  levels: { url: levelsSymbolUrl, image: null, tints: new Map() },
  characters: { url: charactersSymbolUrl, image: null, tints: new Map() },
};

export function setBackArrowArt(image) {
  setBrushArt('back', image);
}

export function setBrushArt(id, image) {
  const slot = BRUSH_ART[id];
  if (!slot) return;
  slot.image = image || null;
  slot.tints.clear();
}

function loadBrushArt(id) {
  const slot = BRUSH_ART[id];
  if (!slot) return null;
  if (slot.image) return slot.image;
  if (typeof Image === 'undefined') return null;
  const image = new Image();
  image.decoding = 'async';
  image.src = slot.url;
  slot.image = image;
  return slot.image;
}

Object.keys(BRUSH_ART).forEach(loadBrushArt);

function artSize(image) {
  const width = image?.naturalWidth || image?.width || 0;
  const height = image?.naturalHeight || image?.height || 0;
  if (!(width > 0 && height > 0)) return null;
  return { width, height };
}

function tintBrushArt(id, image, tone, width, height) {
  if (!image || !(width > 0) || !(height > 0)) return null;
  if (tone === COLOR.ink) return image;
  const slot = BRUSH_ART[id];
  if (!slot) return image;
  const key = `${tone}:${Math.round(width)}x${Math.round(height)}`;
  const cached = slot.tints.get(key);
  if (cached) return cached;
  if (typeof document === 'undefined' || !document.createElement) return image;
  try {
    const sheet = document.createElement('canvas');
    sheet.width = Math.max(1, Math.round(width));
    sheet.height = Math.max(1, Math.round(height));
    const ink = sheet.getContext('2d');
    if (!ink) return image;
    ink.clearRect(0, 0, sheet.width, sheet.height);
    ink.drawImage(image, 0, 0, sheet.width, sheet.height);
    ink.globalCompositeOperation = 'source-in';
    ink.fillStyle = tone;
    ink.fillRect(0, 0, sheet.width, sheet.height);
    slot.tints.set(key, sheet);
    return sheet;
  } catch {
    return image;
  }
}

function phoneLayout(width, height) {
  return width > 0 && width < 760 && height > width;
}

const PAPER = [
  [92, 48], [748, 40], [804, 64], [822, 128], [808, 198],
  [824, 286], [806, 372], [820, 468], [778, 548], [150, 562],
  [104, 530], [86, 168],
];

const SHEET = [
  [78, 62], [760, 54], [830, 86], [844, 160], [828, 250],
  [846, 340], [824, 430], [840, 520], [790, 582], [120, 586],
  [70, 540], [64, 180],
];

const FIBERS = [100, 168, 236, 304, 372, 440, 508];
const SPECKS = [
  [230, 86, 2.2],
  [248, 100, 1.2],
  [690, 500, 2.1],
  [708, 486, 1.3],
];

const POSES = {
  stand: {
    lean: 0,
    head: [-2, -100],
    left: [-6, 2, -5, 14],
    right: [6, 2, 5, 14],
    skirt: [0, -54, 54, 36],
  },
  load: {
    lean: 0.06,
    head: [-2, -92],
    left: [-8, 6, -6, 14],
    right: [8, 6, 6, 14],
    skirt: [0, -48, 56, 32],
  },
  tuck: {
    lean: -0.04,
    head: [-2, -104],
    left: [-6, -2, -4, 1],
    right: [5, 6, 4, 11],
    skirt: [-2, -58, 52, 34],
  },
  land: {
    lean: 0,
    head: [-2, -96],
    left: [-7, 4, -5, 14],
    right: [7, 4, 5, 14],
    skirt: [-2, -50, 58, 34],
  },
  stumble: {
    lean: 0.5,
    head: [2, -98],
    left: [-8, 2, -6, 14],
    right: [10, 4, 8, 16],
    skirt: [4, -52, 52, 32],
  },
};

function poly(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
}

function ink(ctx, width, draw) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = COLOR.ink;
  ctx.lineWidth = width;
  ctx.beginPath();
  draw(ctx);
  ctx.stroke();
  ctx.restore();
}

function umbrellaHem(sx, srx, sry, t) {
  const x = sx + (t - 0.5) * srx * 2;
  const droop = Math.sin(t * Math.PI);
  return { x, y: sry * (0.72 + droop * 0.28) };
}

function dressColors(vm) {
  const dress = vm.dress || {};
  return {
    skirt: dress.skirt || COLOR.skirt,
    deep: dress.deep || COLOR.skirtDeep,
  };
}

function drawSkirt(ctx, spec, colors) {
  const [sx, sy, srx, sry] = spec.skirt;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  for (let i = 0; i <= 12; i += 1) {
    const hem = umbrellaHem(sx, srx, sry, i / 12);
    ctx.lineTo(hem.x, sy + hem.y);
  }
  ctx.closePath();
  ctx.fillStyle = colors.skirt;
  ctx.fill();
  ctx.fillStyle = colors.deep;
  ctx.beginPath();
  ctx.moveTo(sx, sy + 2);
  for (let i = 2; i <= 10; i += 1) {
    const hem = umbrellaHem(sx, srx * 0.72, sry * 0.78, i / 12);
    ctx.lineTo(hem.x, sy + hem.y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  for (let i = 0; i <= 12; i += 1) {
    const hem = umbrellaHem(sx, srx, sry, i / 12);
    ctx.lineTo(hem.x, sy + hem.y);
  }
  ctx.closePath();
  ctx.strokeStyle = COLOR.ink;
  ctx.lineWidth = 2.6;
  ctx.stroke();
  ink(ctx, 1.6, (pen) => {
    [0.2, 0.36, 0.5, 0.64, 0.8].forEach((t) => {
      const hem = umbrellaHem(sx, srx, sry, t);
      pen.moveTo(sx, sy);
      pen.lineTo(hem.x, sy + hem.y * 0.92);
    });
  });
}

function poseOf(vm) {
  return POSES[vm.pose] || POSES.stand;
}

function bodyTriangle(spec) {
  const [, hy] = spec.head;
  const [sx, sy] = spec.skirt;
  const top = hy + 11;
  const height = sy - top;
  const side = (height * 2) / Math.sqrt(3);
  return {
    left: { x: sx - side / 2, y: top },
    right: { x: sx + side / 2, y: top },
    tip: { x: sx, y: top + height },
  };
}

function gripsLocal(spec) {
  const body = bodyTriangle(spec);
  return [
    { x: body.left.x - 22, y: body.left.y + 8 },
    { x: body.right.x + 22, y: body.right.y + 8 },
  ];
}

function toWorld(vm, local) {
  const spec = poseOf(vm);
  const originY = FIGURE.ground - vm.lift * 46;
  const c = Math.cos(spec.lean);
  const s = Math.sin(spec.lean);
  return {
    x: FIGURE.x + local.x * c - local.y * s,
    y: originY + local.x * s + local.y * c,
  };
}

function gripsWorld(vm) {
  return gripsLocal(poseOf(vm)).map((grip) => toWorld(vm, grip));
}

function drawBody(ctx, spec, colors) {
  const body = bodyTriangle(spec);
  ctx.beginPath();
  ctx.moveTo(body.left.x, body.left.y);
  ctx.lineTo(body.right.x, body.right.y);
  ctx.lineTo(body.tip.x, body.tip.y);
  ctx.closePath();
  ctx.fillStyle = colors.skirt;
  ctx.fill();
  ctx.strokeStyle = COLOR.ink;
  ctx.lineWidth = 2.4;
  ctx.stroke();
}

function drawHands(ctx, spec, character) {
  const body = bodyTriangle(spec);
  const grips = gripsLocal(spec);
  const shoulders = [
    [body.left.x, body.left.y],
    [body.right.x, body.right.y],
  ];
  const arch = character === 'ballerina' ? 18 : 12;
  ink(ctx, character === 'ballerina' ? 2.8 : 3.2, (pen) => {
    shoulders.forEach((shoulder, index) => {
      const grip = grips[index];
      pen.moveTo(shoulder[0], shoulder[1]);
      pen.quadraticCurveTo((shoulder[0] + grip.x) / 2, shoulder[1] + arch, grip.x, grip.y);
    });
  });
  ctx.fillStyle = COLOR.ink;
  grips.forEach((grip) => {
    ctx.beginPath();
    ctx.arc(grip.x, grip.y, character === 'ballerina' ? 5.5 : 6.5, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawBunHead(ctx, sx, hy) {
  ctx.fillStyle = COLOR.ink;
  ctx.beginPath();
  ctx.arc(sx, hy, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(sx - 1, hy - 12, 4.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawBallerinaHead(ctx, sx, hy) {
  ctx.fillStyle = COLOR.ink;
  ctx.beginPath();
  ctx.arc(sx, hy, 9, 0, Math.PI * 2);
  ctx.fill();
  // Classical high bun seated on the crown (centers ~hy-12 so the oval overlaps the head).
  ctx.beginPath();
  ctx.ellipse(sx, hy - 12, 7.2, 6.2, 0, 0, Math.PI * 2);
  ctx.fill();
  ink(ctx, 2, (pen) => {
    pen.moveTo(sx - 8, hy - 12);
    pen.quadraticCurveTo(sx - 1, hy - 24, sx + 8, hy - 13);
    pen.moveTo(sx + 8, hy - 13);
    pen.quadraticCurveTo(sx + 1, hy - 9, sx - 3, hy - 11);
  });
  // Slim neck so the head sits above the triangle body.
  ink(ctx, 2.4, (pen) => {
    pen.moveTo(sx, hy + 8);
    pen.lineTo(sx, hy + 16);
  });
}

function drawLegs(ctx, spec, character) {
  const [sx, sy, , sry] = spec.skirt;
  const hem = sy + sry * 0.9;
  if (character === 'ballerina') {
    ink(ctx, 2.6, (pen) => {
      pen.moveTo(sx - 6, hem);
      pen.quadraticCurveTo(spec.left[0] - 4, spec.left[1] - 2, spec.left[2] - 2, spec.left[3]);
      pen.moveTo(sx + 6, hem);
      pen.quadraticCurveTo(spec.right[0] + 4, spec.right[1] - 2, spec.right[2] + 2, spec.right[3]);
    });
    // Pointed ballet shoes.
    ink(ctx, 2.4, (pen) => {
      pen.moveTo(spec.left[2] - 2, spec.left[3]);
      pen.lineTo(spec.left[2] - 11, spec.left[3] + 3);
      pen.moveTo(spec.right[2] + 2, spec.right[3]);
      pen.lineTo(spec.right[2] + 11, spec.right[3] + 3);
    });
    return;
  }
  ink(ctx, 3.6, (pen) => {
    pen.moveTo(sx - 4, hem);
    pen.quadraticCurveTo(spec.left[0], spec.left[1], spec.left[2], spec.left[3]);
    pen.moveTo(sx + 4, hem);
    pen.quadraticCurveTo(spec.right[0], spec.right[1], spec.right[2], spec.right[3]);
  });
}

function figureKind(vm) {
  return vm?.character === 'ballerina' ? 'ballerina' : 'bun';
}

function drawFigure(ctx, vm) {
  const spec = poseOf(vm);
  const character = figureKind(vm);
  const y = FIGURE.ground - vm.lift * 46;
  ctx.save();
  ctx.translate(FIGURE.x, y);
  ctx.rotate(spec.lean);
  const [sx] = spec.skirt;
  const colors = dressColors(vm);
  drawLegs(ctx, spec, character);
  if (character === 'ballerina') {
    const outer = {
      ...spec,
      skirt: [spec.skirt[0], spec.skirt[1] + 4, spec.skirt[2] * 1.28, spec.skirt[3] * 1.18],
    };
    const inner = {
      ...spec,
      skirt: [spec.skirt[0], spec.skirt[1] + 8, spec.skirt[2] * 0.82, spec.skirt[3] * 0.72],
    };
    drawSkirt(ctx, outer, colors);
    drawSkirt(ctx, inner, {
      skirt: colors.deep,
      deep: colors.skirt,
    });
  } else {
    drawSkirt(ctx, spec, colors);
  }
  const [, hy] = spec.head;
  drawBody(ctx, spec, colors);
  if (character === 'ballerina') drawBallerinaHead(ctx, sx, hy);
  else drawBunHead(ctx, sx, hy);
  drawHands(ctx, spec, character);
  ctx.restore();
}

function drawCharacterPreview(ctx, hit, character, selected, locked) {
  const cx = hit.x + hit.w / 2;
  const cy = hit.y + hit.h / 2;
  const tone = locked
    ? COLOR.pencilLine
    : (selected || hit.done ? COLOR.cinnabar : COLOR.ink);
  const scale = Math.min(hit.w, hit.h) / 130;
  ctx.save();
  ctx.translate(cx, cy + 22 * scale);
  ctx.scale(scale, scale);
  ctx.fillStyle = tone;
  ctx.strokeStyle = tone;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (character === 'ballerina') {
    ctx.beginPath();
    ctx.arc(0, -40, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -48, 6.2, 5.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-7, -48);
    ctx.quadraticCurveTo(-1, -58, 6, -49);
    ctx.quadraticCurveTo(1, -45, -2, -47);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-12, -26);
    ctx.lineTo(12, -26);
    ctx.lineTo(0, -2);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -10);
    for (let i = 0; i <= 12; i += 1) {
      const t = i / 12;
      const x = (t - 0.5) * 68;
      const droop = Math.sin(t * Math.PI);
      ctx.lineTo(x, -2 + droop * 26);
    }
    ctx.closePath();
    ctx.globalAlpha = locked ? 0.35 : 0.55;
    ctx.fill();
    ctx.globalAlpha = locked ? 0.4 : 1;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -4);
    for (let i = 0; i <= 10; i += 1) {
      const t = i / 10;
      const x = (t - 0.5) * 42;
      const droop = Math.sin(t * Math.PI);
      ctx.lineTo(x, 2 + droop * 14);
    }
    ctx.closePath();
    ctx.globalAlpha = locked ? 0.2 : 0.35;
    ctx.fill();
    ctx.globalAlpha = locked ? 0.4 : 1;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-8, 8);
    ctx.lineTo(-16, 14);
    ctx.moveTo(8, 8);
    ctx.lineTo(16, 14);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(0, -36, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-1, -48, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-16, -22);
    ctx.lineTo(16, -22);
    ctx.lineTo(0, 4);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, -6);
    for (let i = 0; i <= 10; i += 1) {
      const t = i / 10;
      const x = (t - 0.5) * 48;
      const droop = Math.sin(t * Math.PI);
      ctx.lineTo(x, droop * 18);
    }
    ctx.closePath();
    ctx.globalAlpha = locked ? 0.35 : 0.55;
    ctx.fill();
    ctx.globalAlpha = locked ? 0.4 : 1;
    ctx.lineWidth = 2.2;
    ctx.stroke();
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(-6, 10);
    ctx.quadraticCurveTo(-10, 4, -8, 16);
    ctx.moveTo(6, 10);
    ctx.quadraticCurveTo(10, 4, 8, 16);
    ctx.stroke();
  }
  ctx.restore();
}

function drawShadow(ctx, lift) {
  ctx.save();
  ctx.strokeStyle = '#b7a890';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.85 - Math.min(lift, 1) * 0.55;
  const x = FIGURE.x + 2;
  const y = FIGURE.ground + 8;
  [0, 1, 2, 3].forEach((i) => {
    ctx.beginPath();
    ctx.moveTo(x - 6 + i * 6, y);
    ctx.lineTo(x - 16 + i * 6, y + 8);
    ctx.stroke();
  });
  ctx.restore();
}

function drawGround(ctx) {
  ink(ctx, 2.4, (pen) => {
    pen.moveTo(280, FIGURE.ground + 14);
    pen.lineTo(720, FIGURE.ground + 14);
  });
}

function ropePoint(angle, t, hands) {
  const [left, right] = hands;
  const midY = (left.y + right.y) / 2;
  const lift = Math.sin(angle);
  const amount = (lift < 0 ? -1 : 1) * (0.45 + Math.abs(lift) * 0.55);
  const crest = amount < 0 ? midY - 88 : FIGURE.ground + 8;
  const yCrest = midY + (crest - midY) * Math.abs(amount);
  return {
    x: left.x + (right.x - left.x) * t - Math.sin(t * Math.PI * 2) * ROPE.wide,
    y: left.y + (right.y - left.y) * t + (yCrest - midY) * Math.sin(t * Math.PI),
  };
}

function drawRope(ctx, vm, dashed, behind) {
  if ((Math.cos(vm.angle) < -0.2) !== behind) return;
  const hands = gripsWorld(vm);
  const steps = 24;
  for (let i = 0; i < steps; i += 1) {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    const mid = (t0 + t1) / 2;
    const p0 = ropePoint(vm.angle, t0, hands);
    const p1 = ropePoint(vm.angle, t1, hands);
    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.strokeStyle = dashed ? COLOR.pencilLine : COLOR.cinnabar;
    ctx.lineWidth = dashed ? 1.5 : 3.2 + (1 - Math.abs(mid - 0.5) * 2) * 3.4;
    ctx.stroke();
  }
}

function drawPage(ctx) {
  ctx.fillStyle = COLOR.sheet;
  poly(ctx, SHEET);
  ctx.fill();
  ctx.fillStyle = COLOR.paper;
  poly(ctx, PAPER);
  ctx.fill();
  ctx.save();
  ctx.strokeStyle = COLOR.fiber;
  ctx.lineWidth = 1.4;
  FIBERS.forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(120, y);
    ctx.lineTo(790, y);
    ctx.stroke();
  });
  ctx.restore();
  ctx.fillStyle = COLOR.ink;
  [156, 268, 392].forEach((y) => {
    ctx.beginPath();
    ctx.arc(118, y, 5, 0, Math.PI * 2);
    ctx.fill();
  });
  SPECKS.forEach(([x, y, r]) => {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPencil(ctx, vm) {
  ctx.save();
  ctx.setLineDash([6, 8]);
  drawRope(ctx, vm, true, false);
  drawRope(ctx, vm, true, true);
  ctx.restore();
}

function drawScore(ctx, vm) {
  ctx.textAlign = 'right';
  ctx.font = `72px ${BRUSH}`;
  ctx.fillStyle = COLOR.cinnabar;
  ctx.fillText(String(vm.score), 820, 128);
  ctx.font = `20px ${PEN}`;
  ctx.fillStyle = COLOR.pencil;
  if (vm.goal) {
    ctx.fillText(`of ${vm.goal}`, 820, 156);
    if (vm.level) {
      ctx.font = `18px ${PEN}`;
      ctx.fillText(`level ${vm.level}`, 820, 182);
    }
  } else {
    ctx.fillText('skips', 820, 156);
    if (vm.showBest) {
      ctx.font = `18px ${PEN}`;
      ctx.fillStyle = COLOR.pencil;
      ctx.fillText(`best ${vm.best}`, 820, 182);
    }
    if (vm.crowned) {
      ctx.fillStyle = COLOR.cinnabar;
      ctx.font = `20px ${PEN}`;
      ctx.fillText('new', 748, 156);
    }
  }
}

function drawFleck(ctx, vm) {
  ctx.save();
  ctx.globalAlpha = vm.fleck;
  ctx.strokeStyle = COLOR.ink;
  ctx.lineWidth = 2;
  const y = FIGURE.ground - vm.lift * 46 + 6;
  [0, 1, 2].forEach((i) => {
    ctx.beginPath();
    ctx.moveTo(FIGURE.x - 28 + i * 8, y);
    ctx.lineTo(FIGURE.x - 42 + i * 8, y + 10);
    ctx.stroke();
  });
  ctx.restore();
}

function inkRand(seed) {
  let s = (Math.imul(Math.floor(Math.abs(seed) * 1000003) || 1, 0x9e3779b1)) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function inkSplash(seed) {
  const rand = inkRand(Number.isFinite(seed) ? seed : 0.5);
  const spin = rand() * Math.PI * 2;
  const kick = (rand() - 0.5) * 22;
  const radius = 62 + rand() * 28;
  const squash = 0.84 + rand() * 0.26;
  const waves = Array.from({ length: 18 }, () => rand());
  const shift = [(rand() - 0.5) * radius * 0.4, (rand() - 0.5) * radius * 0.4];
  const lumps = Array.from({ length: 5 }, () => {
    const turn = rand() * Math.PI * 2;
    const dist = 0.28 + rand() * 0.38;
    const size = 0.26 + rand() * 0.2;
    return [Math.cos(turn) * dist, Math.sin(turn) * dist, size];
  });
  const spots = Array.from({ length: 6 }, (_, index) => [
    188 + rand() * 540,
    108 + rand() * 370,
    index % 2 === 0 ? 20 + rand() * 16 : 11 + rand() * 9,
    0.78 + rand() * 0.32,
    rand() * Math.PI * 2,
  ]);
  const specks = [
    [176, 108],
    [748, 124],
    [188, 496],
    [734, 478],
  ].map(([x, y], index) => [
    x + (rand() - 0.5) * 46,
    y + (rand() - 0.5) * 36,
    2.2 + rand() * 2.4,
    index % 3,
  ]);
  for (let index = 0; index < 26; index += 1) {
    specks.push([
      168 + rand() * 590,
      96 + rand() * 400,
      index % 5 === 0 ? 6 + rand() * 7 : index % 2 === 0 ? 2.5 + rand() * 1.8 : 1.05 + rand() * 1.05,
      index % 3,
    ]);
  }
  return { kick, spin, radius, squash, waves, shift, lumps, spots, specks };
}

function fillEllipse(ctx, x, y, rx, ry, rotation) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(1, rx), Math.max(1, ry), rotation, 0, Math.PI * 2);
  ctx.fill();
}

function fillRoundBlot(ctx, x, y, radius, squash, spin, waves) {
  const steps = waves.length;
  const pts = waves.map((wave, index) => {
    const a = spin + (index / steps) * Math.PI * 2;
    const wobble = 0.84 + wave * 0.3;
    return [
      x + Math.cos(a) * radius * wobble,
      y + Math.sin(a) * radius * wobble * squash,
    ];
  });
  ctx.beginPath();
  ctx.moveTo((pts[0][0] + pts[steps - 1][0]) / 2, (pts[0][1] + pts[steps - 1][1]) / 2);
  for (let i = 0; i < steps; i += 1) {
    const next = pts[(i + 1) % steps];
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + next[0]) / 2, (pts[i][1] + next[1]) / 2);
  }
  ctx.closePath();
  ctx.fill();
}

function drawSplash(ctx, vm) {
  const t = Math.min(1, Math.max(0, vm.blot));
  const grow = 1 - (1 - Math.min(1, t / 0.5)) ** 2;
  const splash = inkSplash(vm.splash);
  const colors = dressColors(vm);
  const ox = FIGURE.x + splash.kick;
  const oy = FIGURE.ground - vm.lift * 46 - 68;
  const radius = splash.radius * (0.32 + 0.68 * grow);
  ctx.save();
  ctx.globalAlpha = Math.min(1, t / 0.08) * ctx.globalAlpha;
  splash.spots.forEach(([x, y, reach, squash, turn], index) => {
    const px = ox + (x - ox) * grow;
    const py = oy + (y - oy) * grow;
    const r = reach * (0.4 + 0.6 * grow);
    ctx.fillStyle = index % 2 === 0 ? colors.skirt : colors.deep;
    fillRoundBlot(ctx, px, py, r, squash, turn, splash.waves);
    ctx.fillStyle = index % 2 === 0 ? colors.deep : COLOR.ink;
    fillEllipse(ctx, px, py, r * 0.42, r * 0.36, turn);
  });
  ctx.fillStyle = colors.skirt;
  fillRoundBlot(ctx, ox, oy, radius, splash.squash, splash.spin, splash.waves);
  splash.lumps.forEach(([dx, dy, size]) => {
    fillEllipse(
      ctx,
      ox + dx * radius,
      oy + dy * radius * splash.squash,
      size * radius,
      size * radius * 0.86,
      splash.spin,
    );
  });
  ctx.fillStyle = colors.deep;
  fillRoundBlot(
    ctx,
    ox + splash.shift[0] * grow,
    oy + splash.shift[1] * grow,
    radius * 0.7,
    splash.squash,
    splash.spin + 0.6,
    splash.waves,
  );
  ctx.fillStyle = COLOR.ink;
  fillEllipse(ctx, ox - radius * 0.06, oy + radius * 0.03, radius * 0.18, radius * 0.15, splash.spin);
  splash.specks.forEach(([x, y, size, tone]) => {
    if (tone === 0) ctx.fillStyle = COLOR.ink;
    else if (tone === 1) ctx.fillStyle = colors.deep;
    else ctx.fillStyle = colors.skirt;
    fillEllipse(
      ctx,
      ox + (x - ox) * grow,
      oy + (y - oy) * grow,
      size,
      size * 0.86,
      splash.spin,
    );
  });
  ctx.restore();
}

function titleSpot(sheet, phone) {
  const playX = phone ? 410 : 250;
  const cardX = phone ? 500 : 480;
  const playY = phone ? 96 : 120;
  const cardY = phone ? 100 : 236;
  return {
    x: playX + (cardX - playX) * sheet,
    y: playY + (cardY - playY) * sheet,
    size: phone ? 28 + sheet * 34 : 32 + 56 * sheet,
  };
}

function drawCountdown(ctx, count, phone) {
  if (count !== 1 && count !== 2 && count !== 3) return;
  ctx.save();
  ctx.fillStyle = COLOR.cinnabar;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${phone ? 96 : 128}px ${BRUSH}`;
  ctx.fillText(String(count), FIGURE.x, phone ? 188 : 236);
  ctx.restore();
}

function drawTitle(ctx, sheet, phone) {
  const spot = titleSpot(sheet, phone);
  const skip = 'skip';
  const inkWord = 'ink';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = `${spot.size}px ${BRUSH}`;
  const skipWidth = ctx.measureText(skip).width;
  const inkWidth = ctx.measureText(inkWord).width;
  const start = spot.x - (skipWidth + inkWidth) / 2;
  ctx.fillStyle = COLOR.cinnabar;
  ctx.fillText(skip, start, spot.y);
  ctx.fillStyle = COLOR.ink;
  ctx.fillText(inkWord, start + skipWidth, spot.y);
  return spot;
}

function drawPlay(ctx, vm, sheet) {
  if (sheet > 0.98) return;
  ctx.save();
  ctx.globalAlpha = 1 - sheet;
  const remain = vm.blot > 0 ? 1 - Math.min(1, vm.blot / 0.42) : 1;
  drawGround(ctx);
  if (vm.pencil) drawPencil(ctx, vm);
  if (remain > 0.04) {
    ctx.save();
    ctx.globalAlpha *= remain;
    drawRope(ctx, vm, false, true);
    drawShadow(ctx, vm.lift);
    drawFigure(ctx, vm);
    drawRope(ctx, vm, false, false);
    ctx.restore();
  }
  if (vm.fleck > 0) drawFleck(ctx, vm);
  if (vm.blot > 0 && vm.phase !== 'cleared' && !vm.won) drawSplash(ctx, vm);
  ctx.restore();
}

function mix(from, to, t) {
  return from + (to - from) * t;
}

function drawCornerScore(ctx, vm, alpha, phone) {
  if (!vm.showScore || alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (phone) ctx.translate(-230, 0);
  drawScore(ctx, vm);
  ctx.restore();
}

function drawRecap(ctx, vm, title, sheet, phone) {
  const alpha = sheet >= 0.4 ? 1 : (sheet - 0.12) / 0.28;
  const scoreDrop = phone ? 78 : 108;
  const bestDrop = phone ? 122 : 176;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = COLOR.cinnabar;
  ctx.font = `${phone ? 52 : 64}px ${BRUSH}`;
  ctx.fillText(String(vm.recap.score), title.x, title.y + scoreDrop);
  if (vm.recap.best > 0) {
    ctx.fillStyle = COLOR.pencil;
    ctx.font = `${phone ? 22 : 28}px ${PEN}`;
    ctx.fillText(`best ${vm.recap.best}`, title.x, title.y + bestDrop);
  }
  if (vm.recap.crowned) {
    ctx.fillStyle = COLOR.cinnabar;
    ctx.font = `22px ${PEN}`;
    ctx.fillText('new', title.x + (phone ? 64 : 90), title.y + (phone ? 78 : 156));
  }
  ctx.restore();
}

function drawMovingScores(ctx, vm, title, sheet, phone) {
  if (vm.recap) {
    if (sheet > 0.12) {
      drawRecap(ctx, vm, title, sheet, phone);
      return;
    }
    drawCornerScore(ctx, vm, 1 - sheet / 0.12, phone);
    return;
  }
  const forming = vm.phase === 'over' || vm.phase === 'cleared';
  const t = forming ? sheet : 0;
  if (!forming) {
    drawCornerScore(ctx, vm, 1 - Math.min(sheet, 1), phone);
    return;
  }
  const ease = 1 - (1 - t) * (1 - t);
  const fromX = phone ? 560 : 760;
  const scoreDrop = phone ? 78 : 108;
  const bestDrop = phone ? 122 : 176;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const x = mix(fromX, title.x, ease);
  const scoreY = mix(128, title.y + scoreDrop, ease);
  ctx.fillStyle = COLOR.cinnabar;
  ctx.font = `${mix(72, phone ? 52 : 64, ease)}px ${BRUSH}`;
  ctx.fillText(String(vm.score), x, scoreY);
  if (t < 0.65) {
    ctx.globalAlpha = 1 - t / 0.65;
    ctx.fillStyle = COLOR.pencil;
    ctx.font = `20px ${PEN}`;
    const caption = vm.phase === 'cleared' ? 'cleared' : (vm.goal ? `of ${vm.goal}` : 'skips');
    ctx.fillText(caption, x, mix(156, title.y + (phone ? 100 : 140), ease));
  }
  if (vm.phase === 'cleared') {
    ctx.globalAlpha = ease;
    ctx.fillStyle = COLOR.pencil;
    ctx.font = `${mix(18, phone ? 22 : 28, ease)}px ${PEN}`;
    ctx.fillText(vm.level ? `level ${vm.level}` : 'level', x, mix(182, title.y + bestDrop, ease));
  } else if (vm.showBest) {
    ctx.globalAlpha = 1;
    ctx.fillStyle = COLOR.pencil;
    ctx.font = `${mix(18, phone ? 22 : 28, ease)}px ${PEN}`;
    ctx.fillText(`best ${vm.best}`, x, mix(182, title.y + bestDrop, ease));
  }
  if (vm.crowned) {
    ctx.globalAlpha = ease;
    ctx.fillStyle = COLOR.cinnabar;
    ctx.font = `22px ${PEN}`;
    ctx.fillText('new', title.x + (phone ? 64 : 90), title.y + (phone ? 78 : 156));
  }
  ctx.restore();
}

function splashSeed(hit) {
  const key = String(hit?.id || hit?.label || hit?.index || 0);
  let seed = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    seed ^= key.charCodeAt(i);
    seed = Math.imul(seed, 16777619);
  }
  return (seed >>> 0) / 4294967296;
}

function splashWaves(seed) {
  const rand = inkRand(0.17 + seed * 0.83);
  return Array.from({ length: 14 }, () => rand());
}

function inkSplashPath(ctx, cx, cy, rx, ry, seed) {
  const waves = splashWaves(seed);
  const spin = seed * Math.PI * 2;
  const steps = waves.length;
  const pts = waves.map((wave, index) => {
    const a = spin + (index / steps) * Math.PI * 2;
    const lobe = index % 3 === 0 ? 0.22 : index % 2 === 0 ? 0.1 : 0;
    const wobble = 0.78 + wave * 0.28 + lobe;
    return [
      cx + Math.cos(a) * rx * wobble,
      cy + Math.sin(a) * ry * wobble,
    ];
  });
  ctx.beginPath();
  ctx.moveTo((pts[0][0] + pts[steps - 1][0]) / 2, (pts[0][1] + pts[steps - 1][1]) / 2);
  for (let i = 0; i < steps; i += 1) {
    const next = pts[(i + 1) % steps];
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + next[0]) / 2, (pts[i][1] + next[1]) / 2);
  }
  ctx.closePath();
}

function drawInkSplash(ctx, hit, selected, locked) {
  const cx = hit.x + hit.w / 2;
  const cy = hit.y + hit.h / 2;
  const rx = hit.w * 0.42;
  const ry = hit.h * 0.4;
  const seed = splashSeed(hit);
  inkSplashPath(ctx, cx, cy, rx, ry, seed);
  if (hit.done && !locked) {
    ctx.fillStyle = COLOR.cinnabar;
    ctx.globalAlpha = 0.12;
    ctx.fill();
    ctx.globalAlpha = locked ? 0.4 : 1;
    inkSplashPath(ctx, cx, cy, rx, ry, seed);
  }
  ctx.strokeStyle = locked
    ? COLOR.pencilLine
    : (selected ? COLOR.cinnabar : COLOR.ink);
  ctx.lineWidth = selected && !locked ? 3.2 : 2.2;
  ctx.stroke();
  // Tiny satellite flecks so it reads as a splash, not a clean oval.
  const rand = inkRand(0.41 + seed * 0.59);
  ctx.fillStyle = locked
    ? COLOR.pencilLine
    : (selected ? COLOR.cinnabar : COLOR.ink);
  for (let i = 0; i < 3; i += 1) {
    const a = spinFor(seed, i);
    const dist = 0.78 + rand() * 0.28;
    const size = 1.4 + rand() * 2.2;
    ctx.beginPath();
    ctx.ellipse(
      cx + Math.cos(a) * rx * dist,
      cy + Math.sin(a) * ry * dist,
      size,
      size * (0.7 + rand() * 0.4),
      a,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

function spinFor(seed, index) {
  return seed * Math.PI * 6 + index * 2.15;
}

function brushTone(selected, locked) {
  if (locked) return COLOR.pencilLine;
  if (selected) return COLOR.cinnabar;
  return COLOR.ink;
}

function paintBrushSymbol(ctx, hit, selected, locked, id, scale = 0.94) {
  const image = loadBrushArt(id);
  const size = artSize(image);
  if (!size) return;
  const tone = brushTone(selected, locked);
  const fit = Math.min(hit.w / size.width, hit.h / size.height) * scale;
  const width = size.width * fit;
  const height = size.height * fit;
  const art = tintBrushArt(id, image, tone, width, height) || image;
  ctx.drawImage(
    art,
    hit.x + (hit.w - width) / 2,
    hit.y + (hit.h - height) / 2,
    width,
    height,
  );
}

function drawChoice(ctx, hit, phone) {
  const selected = Boolean(hit.selected);
  const locked = Boolean(hit.locked);
  const cx = hit.x + hit.w / 2;
  const cy = hit.y + hit.h / 2;
  const mode = hit.id === 'infinity' || hit.id === 'levels' || hit.id === 'characters';
  const character = hit.id === 'bun' || hit.id === 'ballerina';
  const back = hit.id === 'back';
  ctx.save();
  ctx.globalAlpha = locked ? 0.4 : 1;
  if (back) {
    paintBrushSymbol(ctx, hit, selected, locked, 'back');
  } else if (mode) {
    paintBrushSymbol(ctx, hit, selected, locked, hit.id, 0.82);
  } else if (character) {
    drawInkSplash(ctx, hit, selected, locked);
    drawCharacterPreview(ctx, hit, hit.id, selected, locked);
  } else {
    drawInkSplash(ctx, hit, selected, locked);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = locked ? COLOR.pencil : (selected ? COLOR.cinnabar : COLOR.ink);
    ctx.font = `${phone ? 24 : 28}px ${BRUSH}`;
    ctx.fillText(locked ? '—' : hit.label, cx, cy - (phone ? 6 : 8));
    ctx.fillStyle = hit.done ? COLOR.cinnabar : COLOR.pencil;
    ctx.font = `${phone ? 13 : 15}px ${PEN}`;
    ctx.fillText(locked ? 'locked' : (hit.done ? 'done' : `${hit.goal}`), cx, cy + (phone ? 14 : 16));
  }
  ctx.restore();
}

function drawMenus(ctx, vm, phone) {
  const items = vm.menu || vm.levels || vm.characters;
  if (items && items.length) items.forEach((hit) => drawChoice(ctx, hit, phone));
  if (vm.exit) drawChoice(ctx, vm.exit, phone);
}

export function drawScene(ctx, width, height, vm, insets) {
  const phone = phoneLayout(width, height);
  const cam = camera(width, height, phone ? PHONE_STAGE : null, insets);
  const sheet = Number.isFinite(vm.sheet) ? vm.sheet : 0;
  const browsing = Boolean(vm.menu || vm.levels || vm.characters);
  const zoom = browsing
    ? menuZoom(phone)
    : 1 + sheet * (phone ? 0.32 : 1.05);
  const spot = titleSpot(sheet, phone);
  const focusX = PAGE.w / 2 + (spot.x - PAGE.w / 2) * sheet;
  const focusY = PAGE.h / 2 + (spot.y - PAGE.h / 2) * sheet;
  ctx.save();
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = COLOR.desk;
  ctx.fillRect(0, 0, width, height);
  ctx.translate(cam.ox, cam.oy);
  ctx.scale(cam.s, cam.s);
  ctx.translate(PAGE.w / 2, PAGE.h / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-focusX, -focusY);
  ctx.fillStyle = COLOR.desk;
  ctx.fillRect(-40, -40, PAGE.w + 80, PAGE.h + 80);
  drawPage(ctx);
  drawPlay(ctx, vm, sheet);
  if (vm.count) drawCountdown(ctx, vm.count, phone);
  const title = drawTitle(ctx, sheet, phone);
  drawMenus(ctx, vm, phone);
  drawMovingScores(ctx, vm, title, sheet, phone);
  if (vm.hint && !vm.recap && !vm.menu && !vm.levels && !vm.characters) {
    ctx.save();
    ctx.globalAlpha = Number.isFinite(vm.hintGlow) ? vm.hintGlow : 1;
    ctx.fillStyle = COLOR.pencil;
    const soft = vm.hint === 'tap drop to leave' || vm.hint === 'level cleared';
    ctx.font = `${soft ? 12 + sheet * 2 : 22 + sheet * 8}px ${PEN}`;
    if (sheet > 0.45) {
      ctx.textAlign = 'center';
      const hintY = (vm.phase === 'over' || vm.phase === 'cleared')
        ? title.y + (phone ? 168 : 232)
        : title.y + (phone ? 64 : 78);
      ctx.fillText(vm.hint, title.x, hintY);
    } else {
      ctx.textAlign = phone ? 'center' : 'left';
      ctx.fillText(vm.hint, phone ? 500 : 250, phone ? 562 : 548);
    }
    ctx.restore();
  }
  ctx.restore();
}
