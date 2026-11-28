import { COLOR, FIGURE, MARKER, PAGE, ROPE } from '../config.js';
import { menuZoom } from '../core/menu.js';
import { camera, phoneLayout, stageForViewport } from './fit.js';
import {
  drawCoffeeRing,
  drawColorPalette,
  drawDeskLighting,
  drawDraftingPencil,
  drawEraserShavings,
  drawPaperClip,
  drawWoodGrain,
} from './desk.js';
import {
  drawEnhancedCostume,
  drawEnhancedFigure,
} from './character.js';
import {
  drawFocusLines,
  drawImpactShockwave,
  drawMangaAura,
  drawMangaCrash,
  drawMangaEmotes,
  drawMangaSfx,
} from './manga.js';
import backSymbolUrl from '../assets/back-symbol.png';
import charactersSymbolUrl from '../assets/characters-symbol.png';
import infinitySymbolUrl from '../assets/infinity-symbol.png';
import levelsSymbolUrl from '../assets/levels-symbol.png';
import octopusHeadUrl from '../assets/octopus-head.png';

const BRUSH = '"Caveat Brush", Georgia, serif';
const PEN = '"Kalam", Georgia, serif';

function shakeOffset(vm) {
  if (!vm.enhanced) return { x: 0, y: 0 };
  if (vm.phase !== 'over' || vm.blot <= 0 || vm.blot >= 0.3) return { x: 0, y: 0 };
  const intensity = (1 - vm.blot / 0.3) * 6;
  const seed = vm.splash * 99991;
  const sx = Math.sin(seed + vm.blot * 71) * intensity;
  const sy = Math.cos(seed + vm.blot * 113) * intensity;
  return { x: sx, y: sy };
}

const BRUSH_ART = {
  back: { url: backSymbolUrl, image: null, tints: new Map() },
  infinity: { url: infinitySymbolUrl, image: null, tints: new Map() },
  levels: { url: levelsSymbolUrl, image: null, tints: new Map() },
  characters: { url: charactersSymbolUrl, image: null, tints: new Map() },
  octopusHead: { url: octopusHeadUrl, image: null, tints: new Map() },
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

function ink(ctx, width, draw, color = COLOR.ink) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
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
  if (vm?.enhanced && vm?.crowned && (vm?.phase === 'over' || vm?.phase === 'cleared')) {
    return {
      skirt: MARKER.gold,
      deep: '#b8860b',
    };
  }
  const dress = vm?.dress || {};
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

function gripsLocal(spec, character = 'bun') {
  if (COSTUME_IDS.has(character)) {
    const [hx, hy] = spec.head;
    // Octopus arms angle down ~30° like the reference; other costumes stay level.
    if (character === 'octopus') {
      return [
        { x: hx - 40, y: hy + 54 },
        { x: hx + 40, y: hy + 54 },
      ];
    }
    return [
      { x: hx - 46, y: hy + 40 },
      { x: hx + 46, y: hy + 40 },
    ];
  }
  const body = bodyTriangle(spec);
  return [
    { x: body.left.x - 22, y: body.left.y + 8 },
    { x: body.right.x + 22, y: body.right.y + 8 },
  ];
}

function figureOrigin(vm) {
  let y = FIGURE.ground - vm.lift * 46;
  let lean = poseOf(vm).lean;
  if (vm.enhanced && (vm.phase === 'menu' || vm.phase === 'count')) {
    const breath = Math.sin((vm.clock || 0) * 2.5);
    y += breath * 1.8;
    lean += breath * 0.012;
  }
  return { x: FIGURE.x, y, lean };
}

function toWorld(vm, local) {
  const origin = figureOrigin(vm);
  const c = Math.cos(origin.lean);
  const s = Math.sin(origin.lean);
  return {
    x: origin.x + local.x * c - local.y * s,
    y: origin.y + local.x * s + local.y * c,
  };
}

function gripsWorld(vm) {
  return gripsLocal(poseOf(vm), figureKind(vm)).map((grip) => toWorld(vm, grip));
}

function traceTriangle(ctx, body) {
  ctx.beginPath();
  ctx.moveTo(body.left.x, body.left.y);
  ctx.lineTo(body.right.x, body.right.y);
  ctx.lineTo(body.tip.x, body.tip.y);
  ctx.closePath();
}

function heartPath(ctx, heart) {
  const { x, top, bottom, half } = heart;
  const h = bottom - top;
  const lobe = top + h * 0.36;
  const cleft = top + h * 0.24;
  ctx.beginPath();
  ctx.moveTo(x, bottom);
  ctx.quadraticCurveTo(x - half * 0.08, top + h * 0.7, x - half * 0.62, lobe + h * 0.12);
  ctx.quadraticCurveTo(x - half * 1.12, lobe, x - half, top + h * 0.12);
  ctx.quadraticCurveTo(x - half * 0.58, top - h * 0.04, x, cleft);
  ctx.quadraticCurveTo(x + half * 0.58, top - h * 0.04, x + half, top + h * 0.12);
  ctx.quadraticCurveTo(x + half * 1.12, lobe, x + half * 0.62, lobe + h * 0.12);
  ctx.quadraticCurveTo(x + half * 0.08, top + h * 0.7, x, bottom);
  ctx.closePath();
}

function bodiceHeart(spec) {
  const [, hy] = spec.head;
  const [sx, sy] = spec.skirt;
  const top = hy + 15;
  const bottom = sy + 6;
  return { x: sx, top, bottom, half: Math.max(14, (bottom - top) * 0.44) };
}

function armRoot(spec) {
  const body = bodyTriangle(spec);
  return [
    { x: body.left.x, y: body.left.y },
    { x: body.right.x, y: body.right.y },
  ];
}

function drawBody(ctx, spec, colors, character) {
  if (character === 'ballerina') {
    const heart = bodiceHeart(spec);
    heartPath(ctx, heart);
    ctx.fillStyle = colors.skirt;
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = COLOR.ink;
    ctx.stroke();
    return;
  }
  const body = bodyTriangle(spec);
  ctx.lineWidth = 2.4;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = COLOR.ink;
  traceTriangle(ctx, body);
  ctx.fillStyle = colors.skirt;
  ctx.fill();
  ctx.stroke();
}

function drawHands(ctx, spec, character) {
  const grips = gripsLocal(spec);
  if (character === 'ballerina') {
    const heart = bodiceHeart(spec);
    const lobe = heart.top + (heart.bottom - heart.top) * 0.34;
    const shoulders = [
      { x: heart.x - heart.half * 0.92, y: lobe },
      { x: heart.x + heart.half * 0.92, y: lobe },
    ];
    ink(ctx, 2.15, (pen) => {
      shoulders.forEach((shoulder, index) => {
        const grip = grips[index];
        pen.moveTo(shoulder.x, shoulder.y);
        pen.quadraticCurveTo(
          (shoulder.x + grip.x) / 2,
          Math.min(shoulder.y, grip.y) - 12,
          grip.x,
          grip.y,
        );
      });
    });
    ctx.strokeStyle = COLOR.ink;
    ctx.lineWidth = 1.8;
    grips.forEach((grip) => {
      ctx.beginPath();
      ctx.arc(grip.x, grip.y, 3.3, 0, Math.PI * 2);
      ctx.stroke();
    });
    return;
  }
  const shoulders = armRoot(spec);
  ink(ctx, 3.2, (pen) => {
    shoulders.forEach((shoulder, index) => {
      const grip = grips[index];
      pen.moveTo(shoulder.x, shoulder.y);
      pen.quadraticCurveTo(
        (shoulder.x + grip.x) / 2,
        (shoulder.y + grip.y) / 2 + 12,
        grip.x,
        grip.y,
      );
    });
  });
  ctx.fillStyle = COLOR.ink;
  grips.forEach((grip) => {
    ctx.beginPath();
    ctx.arc(grip.x, grip.y, 6.5, 0, Math.PI * 2);
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

function traceScallopTutu(ctx, sx, top, rx, ry) {
  const n = 6;
  ctx.beginPath();
  ctx.moveTo(sx, top);
  ctx.lineTo(sx - rx, top + ry * 0.4);
  for (let i = 0; i < n; i += 1) {
    const t1 = (i + 1) / n;
    const tm = (i + 0.5) / n;
    const x1 = sx - rx + t1 * rx * 2;
    const y1 = top + ry * (0.32 + Math.sin(t1 * Math.PI) * 0.18);
    const xm = sx - rx + tm * rx * 2;
    const ym = top + ry * (0.78 + Math.sin(tm * Math.PI) * 0.36);
    ctx.quadraticCurveTo(xm, ym, x1, y1);
  }
  ctx.lineTo(sx, top);
  ctx.closePath();
}

function drawTutu(ctx, spec, colors) {
  const [sx, sy, srx, sry] = spec.skirt;
  const top = sy + 1;
  const rx = srx * 1.05;
  const ry = sry * 0.58;
  ctx.lineJoin = 'round';
  traceScallopTutu(ctx, sx, top, rx, ry);
  ctx.fillStyle = colors.skirt;
  ctx.fill();
  ctx.strokeStyle = COLOR.ink;
  ctx.lineWidth = 2.2;
  ctx.stroke();
  ink(ctx, 1.25, (pen) => {
    for (let i = 0; i < 6; i += 1) {
      const tm = (i + 0.5) / 6;
      const xm = sx - rx + tm * rx * 2;
      const ym = top + ry * (0.62 + Math.sin(tm * Math.PI) * 0.28);
      pen.moveTo(sx + (xm - sx) * 0.12, top + 2);
      pen.lineTo(xm, ym);
    }
  });
}

function drawPointe(ctx, x, y, dir, planted, color) {
  ctx.beginPath();
  ctx.lineJoin = 'round';
  if (!planted) {
    ctx.moveTo(x, y - 2);
    ctx.quadraticCurveTo(x + dir * 8, y - 1, x + dir * 15, y + 2.2);
    ctx.quadraticCurveTo(x + dir * 8, y + 5.2, x, y + 2);
  } else {
    const floor = 13.2;
    ctx.moveTo(x, y - 1);
    ctx.quadraticCurveTo(x + dir * 9, floor - 7, x + dir * 16, floor - 1.6);
    ctx.quadraticCurveTo(x + dir * 9, floor + 2.4, x + dir * 1.2, floor);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = COLOR.ink;
  ctx.lineWidth = 1.7;
  ctx.stroke();
  const toe = planted ? 16 : 15;
  const ankle = planted ? 11.4 : y;
  ink(ctx, 1.15, (pen) => {
    pen.moveTo(x + dir * 1.5, ankle - 2.4);
    pen.lineTo(x + dir * toe * 0.55, ankle + 1.6);
    pen.moveTo(x + dir * 2.2, ankle + 1.2);
    pen.lineTo(x + dir * toe * 0.42, ankle - 2.2);
  });
}

function balletPose(spec) {
  const [sx, sy] = spec.skirt;
  const hip = sy + 4;
  const leftY = spec.left[3];
  const rightY = spec.right[3];
  const planted = Math.min(leftY, rightY) >= 10;
  if (planted) {
    return {
      planted,
      left: { hipX: sx - 1, hipY: hip, ankleX: spec.left[2] - 4, ankleY: leftY - 8 },
      right: { hipX: sx + 1, hipY: hip, ankleX: spec.right[2] + 4, ankleY: rightY - 8 },
    };
  }
  // Jump: both knees turn out, pointed feet hang close under the tutu.
  return {
    planted,
    left: {
      hipX: sx - 1,
      hipY: hip,
      kneeX: sx - 24,
      kneeY: hip + 28,
      ankleX: sx - 6,
      ankleY: hip + 42,
    },
    right: {
      hipX: sx + 1,
      hipY: hip,
      kneeX: sx + 26,
      kneeY: hip + 32,
      ankleX: sx + 10,
      ankleY: hip + 46,
    },
  };
}

function drawHangingPointe(ctx, x, y, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.PI / 2);
  drawPointe(ctx, 0, 0, 1, false, color);
  ctx.restore();
}

function drawBalletFeet(ctx, pose, color) {
  if (pose.planted) {
    drawPointe(ctx, pose.left.ankleX, pose.left.ankleY, -1, true, color);
    drawPointe(ctx, pose.right.ankleX, pose.right.ankleY, 1, true, color);
    return;
  }
  drawHangingPointe(ctx, pose.left.ankleX, pose.left.ankleY, color);
  drawHangingPointe(ctx, pose.right.ankleX, pose.right.ankleY, color);
}

function drawBalletLimbs(ctx, spec, colors) {
  const pose = balletPose(spec);
  ink(ctx, 2.3, (pen) => {
    [pose.left, pose.right].forEach((leg) => {
      pen.moveTo(leg.hipX, leg.hipY);
      if (!pose.planted) pen.lineTo(leg.kneeX, leg.kneeY);
      pen.lineTo(leg.ankleX, leg.ankleY);
    });
  });
  drawBalletFeet(ctx, pose, colors.skirt);
}

function drawBallerinaHead(ctx, spec) {
  const [sx] = spec.skirt;
  const [, hy] = spec.head;
  const r = 12;
  ctx.fillStyle = COLOR.ink;
  ctx.beginPath();
  ctx.ellipse(sx + 2.2, hy - r - 2.2, 5.2, 4.5, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(sx, hy, r, 0, Math.PI * 2);
  ctx.fill();
  const heart = bodiceHeart(spec);
  ink(ctx, 2.1, (pen) => {
    pen.moveTo(sx, hy + r - 1);
    pen.lineTo(heart.x, heart.top + (heart.bottom - heart.top) * 0.2);
  });
}

function drawLegs(ctx, spec, character, colors) {
  const [sx, sy, , sry] = spec.skirt;
  const hem = sy + sry * 0.9;
  if (character === 'ballerina') {
    drawBalletLimbs(ctx, spec, colors);
    return;
  }
  ink(ctx, 3.6, (pen) => {
    pen.moveTo(sx - 4, hem);
    pen.quadraticCurveTo(spec.left[0], spec.left[1], spec.left[2], spec.left[3]);
    pen.moveTo(sx + 4, hem);
    pen.quadraticCurveTo(spec.right[0], spec.right[1], spec.right[2], spec.right[3]);
  });
}

function drawBalletShoes(ctx, vm) {
  if (figureKind(vm) !== 'ballerina') return;
  const spec = poseOf(vm);
  const pose = balletPose(spec);
  const origin = figureOrigin(vm);
  ctx.save();
  ctx.translate(origin.x, origin.y);
  ctx.rotate(origin.lean);
  drawBalletFeet(ctx, pose, dressColors(vm).skirt);
  ctx.restore();
}

const COSTUME_IDS = new Set(['scarecrow', 'pumpkin', 'samurai', 'octopus']);

function costumeFrame(spec) {
  const [hx, hy] = spec.head;
  const [, sy] = spec.skirt;
  return {
    hx,
    hy,
    neck: hy + 16,
    hem: sy + 48,
  };
}

function traceMirrored(ctx, hx, right) {
  ctx.beginPath();
  ctx.moveTo(right[0][0], right[0][1]);
  for (let i = 1; i < right.length; i += 1) ctx.lineTo(right[i][0], right[i][1]);
  for (let i = right.length - 2; i >= 0; i -= 1) {
    const [x, y] = right[i];
    ctx.lineTo(hx - (x - hx), y);
  }
  ctx.closePath();
}

function fillOutlined(ctx, fill, tone) {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = tone || COLOR.ink;
  ctx.lineWidth = 2.6;
  ctx.stroke();
}

function drawStickLegs(ctx, spec, hem, tone) {
  const [sx] = spec.skirt;
  ink(ctx, 4.4, (pen) => {
    pen.moveTo(sx - 6, hem - 1);
    pen.lineTo(spec.left[2], spec.left[3]);
    pen.moveTo(sx + 6, hem - 1);
    pen.lineTo(spec.right[2], spec.right[3]);
  }, tone || COLOR.ink);
}

function drawCurvedArms(ctx, frame, grips, tone) {
  const { hx, neck } = frame;
  ink(ctx, 4, (pen) => {
    grips.forEach((grip, index) => {
      const sign = index === 0 ? -1 : 1;
      pen.moveTo(hx + sign * 11, neck + 1);
      pen.quadraticCurveTo(hx + sign * 32, neck + 10, grip.x, grip.y);
    });
  }, tone || COLOR.ink);
}

function drawPalms(ctx, grips, tone) {
  ctx.fillStyle = tone || COLOR.ink;
  grips.forEach((grip) => {
    ctx.beginPath();
    ctx.arc(grip.x, grip.y, 6.6, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawStrawBurst(ctx, grip, dir, straw, tone) {
  ctx.save();
  ctx.strokeStyle = tone || straw;
  ctx.lineCap = 'round';
  ctx.lineWidth = 2.8;
  [-1.15, -0.55, 0.05, 0.65, 1.25].forEach((turn, index) => {
    const ang = dir < 0 ? Math.PI - turn : turn;
    const len = 11 + (index % 2) * 4;
    ctx.beginPath();
    ctx.moveTo(grip.x + Math.cos(ang) * 5, grip.y + Math.sin(ang) * 5);
    ctx.lineTo(grip.x + Math.cos(ang) * len, grip.y + Math.sin(ang) * len);
    ctx.stroke();
  });
  ctx.restore();
}

function drawNeck(ctx, hx, top, bottom, tone) {
  ink(ctx, 4.2, (pen) => {
    pen.moveTo(hx, top);
    pen.lineTo(hx, bottom);
  }, tone || COLOR.ink);
}

function drawJaggedTunic(ctx, frame, flare, tone, fill) {
  const { hx, neck, hem } = frame;
  const mid = neck + (hem - neck) * 0.55;
  traceMirrored(ctx, hx, [
    [hx + 8, neck + 4],
    [hx + flare * 0.45, neck + 18],
    [hx + flare * 0.7, mid],
    [hx + flare, hem - 8],
    [hx + flare * 0.72, hem + 7],
    [hx + flare * 0.4, hem - 3],
    [hx + flare * 0.16, hem + 8],
    [hx, hem + 1],
  ]);
  fillOutlined(ctx, fill, tone);
}

function drawScarecrow(ctx, spec, colors, tone) {
  const frame = costumeFrame(spec);
  const { hx, hy, neck, hem } = frame;
  const straw = tone || MARKER.straw;
  const band = tone || MARKER.band;
  const cloth = tone || colors.skirt;
  const deep = tone || colors.deep;
  const grips = gripsLocal(spec, 'scarecrow');
  drawStickLegs(ctx, spec, hem, tone);
  drawJaggedTunic(ctx, frame, 34, tone, cloth);
  ctx.save();
  ctx.clip();
  ctx.fillStyle = deep;
  ctx.fillRect(hx - 8, neck + 20, 16, hem - neck);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(hx - 16, hem - 20);
  ctx.lineTo(hx - 6, hem - 26);
  ctx.lineTo(hx - 2, hem - 14);
  ctx.lineTo(hx - 16, hem - 10);
  ctx.closePath();
  fillOutlined(ctx, COLOR.paper, tone);
  const waist = neck + 24;
  ctx.beginPath();
  ctx.moveTo(hx - 18, waist);
  ctx.quadraticCurveTo(hx, waist - 4, hx + 16, waist + 1);
  ctx.lineTo(hx + 16, waist + 6);
  ctx.quadraticCurveTo(hx, waist + 3, hx - 18, waist + 7);
  ctx.closePath();
  fillOutlined(ctx, straw, tone);
  ctx.beginPath();
  ctx.moveTo(hx + 12, waist + 2);
  ctx.quadraticCurveTo(hx + 22, waist - 6, hx + 26, waist + 3);
  ctx.quadraticCurveTo(hx + 16, waist + 7, hx + 12, waist + 2);
  ctx.moveTo(hx + 14, waist + 5);
  ctx.lineTo(hx + 24, waist + 16);
  ctx.lineTo(hx + 16, waist + 10);
  ctx.lineTo(hx + 10, waist + 16);
  ctx.closePath();
  fillOutlined(ctx, straw, tone);
  drawCurvedArms(ctx, frame, grips, tone);
  traceMirrored(ctx, hx, [
    [hx, neck + 16],
    [hx + 8, neck + 6],
    [hx + 14, neck + 14],
    [hx + 22, neck + 4],
    [hx + 30, neck + 12],
    [hx + 24, neck - 2],
    [hx + 14, neck + 4],
    [hx, neck - 4],
  ]);
  fillOutlined(ctx, straw, tone);
  grips.forEach((grip, index) => {
    drawStrawBurst(ctx, grip, index === 0 ? -1 : 1, straw, tone);
    ctx.beginPath();
    ctx.arc(grip.x, grip.y, 6.6, 0, Math.PI * 2);
    fillOutlined(ctx, straw, tone);
  });
  drawNeck(ctx, hx, hy + 16, neck + 6, tone);
  ctx.beginPath();
  ctx.arc(hx, hy + 10, 13, 0, Math.PI * 2);
  fillOutlined(ctx, straw, tone);
  ctx.beginPath();
  ctx.moveTo(hx - 17, hy + 6);
  ctx.lineTo(hx - 14, hy - 12);
  ctx.lineTo(hx + 14, hy - 12);
  ctx.lineTo(hx + 17, hy + 6);
  ctx.closePath();
  fillOutlined(ctx, straw, tone);
  ctx.beginPath();
  ctx.moveTo(hx - 16, hy - 5);
  ctx.lineTo(hx + 16, hy - 5);
  ctx.lineTo(hx + 17, hy + 1);
  ctx.lineTo(hx - 17, hy + 1);
  ctx.closePath();
  fillOutlined(ctx, band, tone);
  ctx.beginPath();
  ctx.moveTo(hx - 12, hy - 10);
  ctx.lineTo(hx - 24, hy - 16);
  ctx.lineTo(hx - 14, hy - 6);
  ctx.lineTo(hx - 22, hy - 4);
  ctx.lineTo(hx - 8, hy - 2);
  ctx.closePath();
  fillOutlined(ctx, straw, tone);
  ctx.beginPath();
  ctx.moveTo(hx - 50, hy + 2);
  ctx.lineTo(hx - 32, hy - 4);
  ctx.lineTo(hx - 16, hy + 2);
  ctx.lineTo(hx, hy - 1);
  ctx.lineTo(hx + 16, hy + 2);
  ctx.lineTo(hx + 32, hy - 4);
  ctx.lineTo(hx + 50, hy + 2);
  ctx.quadraticCurveTo(hx + 22, hy + 10, hx, hy + 8);
  ctx.quadraticCurveTo(hx - 22, hy + 10, hx - 50, hy + 2);
  ctx.closePath();
  fillOutlined(ctx, straw, tone);
}

function drawPumpkin(ctx, spec, colors, tone) {
  const frame = costumeFrame(spec);
  const { hx, hy, neck, hem } = frame;
  const orange = tone || MARKER.pumpkin;
  const leaf = tone || MARKER.leaf;
  const stem = tone || MARKER.leafDeep;
  const cloth = tone || colors.skirt;
  const deep = tone || colors.deep;
  const line = tone || COLOR.ink;
  const grips = gripsLocal(spec, 'pumpkin');
  const mid = neck + (hem - neck) * 0.5;
  drawStickLegs(ctx, spec, hem, tone);
  traceMirrored(ctx, hx, [
    [hx + 10, neck + 6],
    [hx + 18, neck + 20],
    [hx + 16, mid],
    [hx + 32, hem - 12],
    [hx + 22, hem + 8],
    [hx + 12, hem - 4],
    [hx + 4, hem + 7],
    [hx, hem],
  ]);
  fillOutlined(ctx, cloth, tone);
  ctx.save();
  ctx.clip();
  traceMirrored(ctx, hx, [
    [hx + 6, hem - 18],
    [hx + 14, hem + 2],
    [hx, hem + 4],
  ]);
  ctx.fillStyle = deep;
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(hx - 16, mid);
  ctx.lineTo(hx - 9, mid - 7);
  ctx.lineTo(hx - 2, mid);
  ctx.lineTo(hx - 9, mid + 7);
  ctx.closePath();
  fillOutlined(ctx, COLOR.paper, tone);
  drawCurvedArms(ctx, frame, grips, tone);
  traceMirrored(ctx, hx, [
    [hx, neck + 20],
    [hx + 10, neck + 8],
    [hx + 16, neck + 16],
    [hx + 24, neck + 4],
    [hx + 34, neck + 14],
    [hx + 26, neck - 2],
    [hx + 14, neck + 4],
    [hx, neck - 8],
  ]);
  fillOutlined(ctx, leaf, tone);
  drawPalms(ctx, grips, tone);
  ctx.beginPath();
  ctx.arc(hx, hy - 4, 22, 0, Math.PI * 2);
  ctx.fillStyle = orange;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = 2.8;
  ctx.stroke();
  const eye = (sign) => {
    ctx.beginPath();
    ctx.moveTo(hx + sign * 13, hy - 12);
    ctx.lineTo(hx + sign * 4, hy - 12);
    ctx.lineTo(hx + sign * 8, hy - 3);
    ctx.closePath();
    ctx.fillStyle = line;
    ctx.fill();
  };
  eye(-1);
  eye(1);
  ctx.beginPath();
  ctx.moveTo(hx - 3, hy - 2);
  ctx.lineTo(hx + 3, hy - 2);
  ctx.lineTo(hx, hy + 4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(hx - 12, hy + 6);
  ctx.lineTo(hx - 7, hy + 11);
  ctx.lineTo(hx - 2, hy + 6);
  ctx.lineTo(hx, hy + 11);
  ctx.lineTo(hx + 2, hy + 6);
  ctx.lineTo(hx + 7, hy + 11);
  ctx.lineTo(hx + 12, hy + 6);
  ctx.lineTo(hx + 10, hy + 14);
  ctx.lineTo(hx, hy + 10);
  ctx.lineTo(hx - 10, hy + 14);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(hx - 1, hy - 24);
  ctx.quadraticCurveTo(hx + 6, hy - 40, hx + 12, hy - 48);
  ctx.quadraticCurveTo(hx + 3, hy - 38, hx + 3, hy - 24);
  ctx.closePath();
  fillOutlined(ctx, stem, tone);
  ctx.beginPath();
  ctx.moveTo(hx - 1, hy - 38);
  ctx.quadraticCurveTo(hx - 18, hy - 52, hx - 20, hy - 34);
  ctx.quadraticCurveTo(hx - 8, hy - 32, hx + 1, hy - 28);
  ctx.closePath();
  fillOutlined(ctx, leaf, tone);
}

function drawSamurai(ctx, spec, colors, tone) {
  const frame = costumeFrame(spec);
  const { hx, hy, neck, hem } = frame;
  const helm = tone || MARKER.helm;
  const stripe = tone || MARKER.helmRed;
  const gold = tone || MARKER.gold;
  const cloth = tone || colors.skirt;
  const deep = tone || colors.deep;
  const line = tone || COLOR.ink;
  const grips = gripsLocal(spec, 'samurai');
  drawStickLegs(ctx, spec, hem, tone);
  traceMirrored(ctx, hx, [
    [hx, neck + 8],
    [hx + 7, neck + 2],
    [hx + 14, neck - 2],
    [hx + 20, neck + 24],
    [hx + 30, hem - 2],
    [hx + 24, hem + 7],
    [hx + 12, hem + 1],
    [hx, hem + 5],
  ]);
  fillOutlined(ctx, cloth, tone);
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = deep;
  ctx.lineWidth = 2.4;
  const span = hem - neck;
  [0.28, 0.42, 0.56, 0.7, 0.84].forEach((t) => {
    const y = neck + span * t;
    ctx.beginPath();
    ctx.moveTo(hx - 34, y);
    ctx.lineTo(hx + 34, y);
    ctx.stroke();
  });
  ctx.restore();
  const waist = neck + (hem - neck) * 0.5;
  traceMirrored(ctx, hx, [
    [hx + 6, waist - 5],
    [hx + 20, waist - 3],
    [hx + 18, waist + 5],
    [hx + 5, waist + 3],
  ]);
  fillOutlined(ctx, deep, tone);
  ctx.beginPath();
  ctx.arc(hx, waist, 4.2, 0, Math.PI * 2);
  ctx.fillStyle = deep;
  ctx.fill();
  ctx.strokeStyle = line;
  ctx.lineWidth = 2;
  ctx.stroke();
  ink(ctx, 2.6, (pen) => {
    pen.moveTo(hx - 3, waist + 2);
    pen.lineTo(hx - 8, waist + 14);
    pen.moveTo(hx + 3, waist + 2);
    pen.lineTo(hx + 8, waist + 14);
  }, line);
  drawCurvedArms(ctx, frame, grips, tone);
  drawPalms(ctx, grips, tone);
  [-1, 1].forEach((sign) => {
    ctx.beginPath();
    ctx.moveTo(hx + sign * 6, hy - 10);
    ctx.lineTo(hx + sign * 40, hy - 2);
    ctx.lineTo(hx + sign * 34, hy + 8);
    ctx.lineTo(hx + sign * 8, hy - 2);
    ctx.closePath();
    fillOutlined(ctx, helm, tone);
    ctx.beginPath();
    ctx.moveTo(hx + sign * 8, hy - 2);
    ctx.lineTo(hx + sign * 34, hy + 8);
    ctx.lineTo(hx + sign * 28, hy + 20);
    ctx.lineTo(hx + sign * 10, hy + 10);
    ctx.closePath();
    fillOutlined(ctx, stripe, tone);
    ink(ctx, 1.8, (pen) => {
      pen.moveTo(hx + sign * 12, hy + 12);
      pen.quadraticCurveTo(hx + sign * 10, hy + 24, hx + sign * 14, hy + 30);
    }, line);
  });
  ctx.beginPath();
  ctx.moveTo(hx - 16, hy - 2);
  ctx.quadraticCurveTo(hx - 18, hy - 26, hx, hy - 28);
  ctx.quadraticCurveTo(hx + 18, hy - 26, hx + 16, hy - 2);
  ctx.quadraticCurveTo(hx, hy - 6, hx - 16, hy - 2);
  ctx.closePath();
  fillOutlined(ctx, helm, tone);
  ctx.beginPath();
  ctx.moveTo(hx - 8, hy - 46);
  ctx.bezierCurveTo(hx - 30, hy - 34, hx - 28, hy - 14, hx, hy - 12);
  ctx.bezierCurveTo(hx + 28, hy - 14, hx + 30, hy - 34, hx + 8, hy - 46);
  ctx.bezierCurveTo(hx + 14, hy - 26, hx + 8, hy - 20, hx, hy - 22);
  ctx.bezierCurveTo(hx - 8, hy - 20, hx - 14, hy - 26, hx - 8, hy - 46);
  ctx.closePath();
  fillOutlined(ctx, gold, tone);
  ctx.beginPath();
  ctx.moveTo(hx - 7, hy + 6);
  ctx.quadraticCurveTo(hx - 9, neck + 6, hx, neck + 16);
  ctx.quadraticCurveTo(hx + 9, neck + 6, hx + 7, hy + 6);
  ctx.closePath();
  ctx.fillStyle = line;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(hx, hy + 4, 10, 0, Math.PI * 2);
  ctx.fillStyle = line;
  ctx.fill();
}

function drawOctopus(ctx, spec, colors, tone) {
  const frame = costumeFrame(spec);
  const { hx, hy, neck, hem } = frame;
  const skin = tone || MARKER.octopus;
  // Fixed robe purple (character identity), not dress tint — matches reference.
  const robe = tone || MARKER.octopusRobe;
  const trim = tone || MARKER.octopusGold;
  const line = tone || COLOR.ink;
  const grips = gripsLocal(spec, 'octopus');
  // Share costumeFrame hem/feet with scarecrow/pumpkin/samurai (same baseline).
  const flare = 30;
  const baseY = hem;
  const apexY = neck + 4;
  const waist = apexY + (baseY - apexY) * 0.48;
  const halfAt = (y) => flare * Math.max(0, (y - apexY) / (baseY - apexY));

  // Stick legs to pose feet — same as other costumes (was hardcoded to y=18).
  drawStickLegs(ctx, spec, hem, tone);

  // Purple A-line triangular robe (apex tucked under tentacle beard)
  ctx.beginPath();
  ctx.moveTo(hx, apexY);
  ctx.lineTo(hx + flare, baseY);
  ctx.lineTo(hx - flare, baseY);
  ctx.closePath();
  fillOutlined(ctx, robe, tone);

  // Gold waist band — must stay inside the triangle silhouette
  const bandHalf = halfAt(waist) * 0.92;
  const bandTop = waist - 3.5;
  const bandBot = waist + 4.5;
  ctx.beginPath();
  ctx.moveTo(hx - bandHalf, bandTop);
  ctx.lineTo(hx + bandHalf, bandTop);
  ctx.lineTo(hx + halfAt(bandBot) * 0.92, bandBot);
  ctx.lineTo(hx - halfAt(bandBot) * 0.92, bandBot);
  ctx.closePath();
  fillOutlined(ctx, trim, tone);

  // Gold vertical center stripe (under beard → waist), drawn after band clip region
  const stripeHalf = 2.8;
  const stripeTop = apexY + 16;
  ctx.beginPath();
  ctx.moveTo(hx - stripeHalf, stripeTop);
  ctx.lineTo(hx + stripeHalf, stripeTop);
  ctx.lineTo(hx + stripeHalf, bandTop);
  ctx.lineTo(hx - stripeHalf, bandTop);
  ctx.closePath();
  fillOutlined(ctx, trim, tone);

  // Lower half: diagonal gold trim lines from waist corners to near hem center,
  // leaving a purple triangle at the base (reference ceremonial trim).
  const gap = 7;
  ink(ctx, 3.8, (pen) => {
    pen.moveTo(hx - bandHalf + 1, bandBot);
    pen.lineTo(hx - gap, baseY - 1);
    pen.moveTo(hx + bandHalf - 1, bandBot);
    pen.lineTo(hx + gap, baseY - 1);
  }, trim);

  // Stick arms from upper robe sides, angling down ~30° to circle hands
  ink(ctx, 3.6, (pen) => {
    grips.forEach((grip, index) => {
      const sign = index === 0 ? -1 : 1;
      const rootY = apexY + (baseY - apexY) * 0.2;
      const rootX = hx + sign * halfAt(rootY) * 0.85;
      pen.moveTo(rootX, rootY);
      pen.lineTo(grip.x, grip.y);
    });
  }, line);
  drawPalms(ctx, grips, tone);

  // Face: reference-matched octopus head sprite (tentacles are the lower face).
  const headImg = loadBrushArt('octopusHead');
  const size = artSize(headImg);
  // Size ≈ robe base width; sit low so tentacles drape over the robe apex.
  const headH = flare * 2.55;
  const headW = size ? headH * (size.width / size.height) : flare * 2.0;
  const headTop = hy - flare * 0.55;
  if (headImg && size) {
    const art = tone && tone !== COLOR.ink
      ? tintBrushArt('octopusHead', headImg, tone, headW, headH)
      : headImg;
    ctx.drawImage(art, hx - headW / 2, headTop, headW, headH);
  } else {
    // Fallback procedural face when the sprite has not loaded yet (tests / boot).
    const Rx = flare * 0.92;
    const Ry = flare * 1.0;
    const cy = hy + 2;
    const lobes = [
      { lx: -1.08, ly: 0.52, rw: 0.28, rh: 0.38, rot: -0.95 },
      { lx: -0.55, ly: 0.78, rw: 0.24, rh: 0.4, rot: -0.25 },
      { lx: -0.18, ly: 0.75, rw: 0.22, rh: 0.36, rot: 0 },
      { lx: 0.18, ly: 0.75, rw: 0.22, rh: 0.36, rot: 0 },
      { lx: 0.55, ly: 0.78, rw: 0.24, rh: 0.4, rot: 0.25 },
      { lx: 1.08, ly: 0.52, rw: 0.28, rh: 0.38, rot: 0.95 },
    ];
    lobes.forEach((t) => {
      ctx.beginPath();
      ctx.ellipse(hx + Rx * t.lx, cy + Ry * t.ly, Rx * t.rw, Ry * t.rh, t.rot, 0, Math.PI * 2);
      ctx.fillStyle = skin;
      ctx.fill();
    });
    ctx.beginPath();
    ctx.ellipse(hx, cy, Rx, Ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = skin;
    ctx.fill();
    ctx.strokeStyle = line;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.ellipse(hx, cy, Rx, Ry, 0, Math.PI - 0.25, 0.25);
    ctx.stroke();
    lobes.forEach((t) => {
      ctx.beginPath();
      ctx.ellipse(hx + Rx * t.lx, cy + Ry * t.ly, Rx * t.rw, Ry * t.rh, t.rot, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.fillStyle = line;
    [-1, 1].forEach((sign) => {
      ctx.beginPath();
      ctx.ellipse(hx + sign * (Rx * 0.38), cy - Ry * 0.12, Rx * 0.34, Ry * 0.2, sign * -0.62, 0, Math.PI * 2);
      ctx.fill();
    });
  }

}

function drawCostume(ctx, spec, colors, character, tone) {
  if (character === 'pumpkin') drawPumpkin(ctx, spec, colors, tone);
  else if (character === 'samurai') drawSamurai(ctx, spec, colors, tone);
  else if (character === 'octopus') drawOctopus(ctx, spec, colors, tone);
  else drawScarecrow(ctx, spec, colors, tone);
}
function figureKind(vm) {
  if (vm?.character === 'ballerina') return 'ballerina';
  if (COSTUME_IDS.has(vm?.character)) return vm.character;
  return 'bun';
}

function drawFigure(ctx, vm) {
  const spec = poseOf(vm);
  const character = figureKind(vm);
  const origin = figureOrigin(vm);
  ctx.save();
  ctx.translate(origin.x, origin.y);
  ctx.rotate(origin.lean);
  const colors = dressColors(vm);
  if (COSTUME_IDS.has(character)) {
    drawCostume(ctx, spec, colors, character);
    if (vm?.enhanced) {
      drawEnhancedCostume(ctx, vm, costumeFrame(spec), character, colors);
    }
    ctx.restore();
    return;
  }
  const [sx] = spec.skirt;
  drawLegs(ctx, spec, character, colors);
  if (character === 'ballerina') drawTutu(ctx, spec, colors);
  else drawSkirt(ctx, spec, colors);
  const [, hy] = spec.head;
  drawBody(ctx, spec, colors, character);
  if (character === 'ballerina') drawBallerinaHead(ctx, spec);
  else drawBunHead(ctx, sx, hy);
  if (vm?.enhanced) {
    drawEnhancedFigure(ctx, vm, spec, character, colors);
  }
  drawHands(ctx, spec, character);
  ctx.restore();
}

function drawCharacterPreview(ctx, hit, character, selected, locked) {
  const cx = hit.x + hit.w / 2;
  const cy = hit.y + hit.h / 2;
  const tone = locked
    ? COLOR.pencilLine
    : (selected || hit.done ? COLOR.cinnabar : COLOR.ink);
  if (COSTUME_IDS.has(character)) {
    const fit = Math.min(hit.w / 156, hit.h / 230);
    ctx.save();
    ctx.translate(cx, cy + hit.h * 0.38);
    ctx.scale(fit, fit);
    drawCostume(ctx, POSES.stand, { skirt: tone, deep: tone }, character, tone);
    ctx.restore();
    return;
  }
  const scale = Math.min(hit.w, hit.h) / 130;
  ctx.save();
  ctx.translate(cx, cy + 22 * scale);
  ctx.scale(scale, scale);
  ctx.fillStyle = tone;
  ctx.strokeStyle = tone;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (character === 'ballerina') {
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-1, -6);
    ctx.lineTo(-6, 16);
    ctx.moveTo(1, -6);
    ctx.lineTo(7, 16);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-6, 14);
    ctx.quadraticCurveTo(-14, 16, -18, 20);
    ctx.quadraticCurveTo(-10, 22, -5, 16);
    ctx.moveTo(7, 14);
    ctx.quadraticCurveTo(16, 16, 20, 20);
    ctx.quadraticCurveTo(11, 22, 6, 16);
    ctx.fill();
    traceScallopTutu(ctx, 0, -10, 34, 16);
    ctx.globalAlpha = locked ? 0.4 : 0.9;
    ctx.fill();
    ctx.globalAlpha = locked ? 0.55 : 1;
    ctx.stroke();
    ctx.globalAlpha = locked ? 0.4 : 1;
    heartPath(ctx, { x: 0, top: -32, bottom: -8, half: 11 });
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -46, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(1.4, -57, 4.4, 3.7, 0.2, 0, Math.PI * 2);
    ctx.fill();
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

const ROPE_ARC = 88;
const ROPE_HALF = 3.3;
const OUTLINE = 1.3;
const HAT_REACH = 12 + OUTLINE;

// The scarecrow hat stays clear of the default arc until the rope has swung
// well down. The pumpkin stem and the samurai crescent stand higher, so their
// arc grows by the same ratio and keeps that clearance.
function ornamentReach(character) {
  if (character === 'pumpkin') return 48 + OUTLINE;
  if (character === 'samurai') return 46 + OUTLINE;
  return 0;
}

function overheadRise(spec, character) {
  const reach = ornamentReach(character);
  if (!reach) return ROPE_ARC;
  const [, hy] = spec.head;
  const hands = gripsLocal(spec, character);
  const drop = (hands[0].y + hands[1].y) / 2 - hy;
  const hat = drop + HAT_REACH + ROPE_HALF;
  return ROPE_ARC * ((drop + reach + ROPE_HALF) / hat);
}

function ropePoint(angle, t, hands, rise = ROPE_ARC) {
  const [left, right] = hands;
  const midY = (left.y + right.y) / 2;
  const lift = Math.sin(angle);
  const amount = (lift < 0 ? -1 : 1) * (0.45 + Math.abs(lift) * 0.55);
  const crest = amount < 0 ? midY - rise : FIGURE.ground + 8;
  const yCrest = midY + (crest - midY) * Math.abs(amount);
  return {
    x: left.x + (right.x - left.x) * t - Math.sin(t * Math.PI * 2) * ROPE.wide,
    y: left.y + (right.y - left.y) * t + (yCrest - midY) * Math.sin(t * Math.PI),
  };
}

function drawRopeGhost(ctx, vm, behind, hands, angleOffset, alpha, rise) {
  const ghostAngle = vm.angle - angleOffset;
  if ((Math.cos(ghostAngle) < -0.2) !== behind) return;
  const steps = 16;
  ctx.save();
  ctx.globalAlpha = (ctx.globalAlpha || 1) * alpha;
  for (let i = 0; i < steps; i += 1) {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    const p0 = ropePoint(ghostAngle, t0, hands, rise);
    const p1 = ropePoint(ghostAngle, t1, hands, rise);
    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.strokeStyle = COLOR.pencilLine;
    ctx.lineWidth = 1.8;
    ctx.stroke();
  }
  ctx.restore();
}

function drawRope(ctx, vm, dashed, behind) {
  const spec = poseOf(vm);
  const hands = gripsWorld(vm);
  const rise = overheadRise(spec, figureKind(vm));
  if (vm.enhanced && !dashed && vm.phase === 'playing' && vm.score > 2) {
    drawRopeGhost(ctx, vm, behind, hands, 0.12, 0.35, rise);
  }
  if ((Math.cos(vm.angle) < -0.2) !== behind) return;
  const steps = 24;
  for (let i = 0; i < steps; i += 1) {
    const t0 = i / steps;
    const t1 = (i + 1) / steps;
    const mid = (t0 + t1) / 2;
    const p0 = ropePoint(vm.angle, t0, hands, rise);
    const p1 = ropePoint(vm.angle, t1, hands, rise);
    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.strokeStyle = dashed ? COLOR.pencilLine : COLOR.cinnabar;
    ctx.lineWidth = dashed ? 1.5 : 3.2 + (1 - Math.abs(mid - 0.5) * 2) * 3.4;
    ctx.stroke();
  }
}

function drawPage(ctx, vm) {
  ctx.fillStyle = COLOR.sheet;
  poly(ctx, SHEET);
  ctx.fill();
  ctx.fillStyle = COLOR.paper;
  poly(ctx, PAPER);
  ctx.fill();
  ctx.save();
  ctx.strokeStyle = COLOR.fiber;
  ctx.lineWidth = 1.4;
  FIBERS.forEach((y, idx) => {
    ctx.beginPath();
    const wave = vm?.enhanced ? Math.sin((vm.clock || 0) * 1.5 + idx) * 1.2 : 0;
    ctx.moveTo(120, y + wave);
    ctx.lineTo(790, y + wave);
    ctx.stroke();
  });
  ctx.restore();
  ctx.fillStyle = COLOR.ink;
  [156, 268, 392].forEach((y) => {
    ctx.beginPath();
    ctx.arc(118, y, 5, 0, Math.PI * 2);
    ctx.fill();
  });
  SPECKS.forEach(([x, y, r], idx) => {
    const pulse = vm?.enhanced ? Math.sin((vm.clock || 0) * 2 + idx) * 0.35 : 0;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.5, r + pulse), 0, Math.PI * 2);
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
  ctx.save();
  if (vm.enhanced && vm.fleck > 0) {
    const pop = 1 + vm.fleck * 0.15;
    ctx.translate(820, 128);
    ctx.scale(pop, pop);
    ctx.translate(-820, -128);
  }
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
  if (vm.enhanced && vm.streak >= 5 && vm.phase === 'playing') {
    ctx.font = `18px ${PEN}`;
    ctx.fillStyle = COLOR.cinnabar;
    ctx.fillText(`${vm.streak} streak!`, 820, vm.showBest ? 208 : 182);
  }
  ctx.restore();
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

function drawLandDust(ctx, vm) {
  if (!vm.enhanced || !(vm.landDust > 0)) return;
  const t = 1 - vm.landDust;
  ctx.save();
  ctx.globalAlpha = vm.landDust * 0.75;
  ctx.fillStyle = COLOR.pencilLine;
  const gy = FIGURE.ground + 14;
  [-1, 1].forEach((dir) => {
    [0.3, 0.6, 0.9].forEach((frac, i) => {
      const dist = 14 + frac * 28 + t * 20;
      const x = FIGURE.x + dir * dist;
      const y = gy - 3 - (1 - frac) * 5 * (1 - t);
      const r = (2 + i * 1.2) * (1 - t * 0.5);
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2);
      ctx.fill();
    });
  });
  ctx.restore();
}

function drawInkBloom(ctx, vm) {
  if (!vm.enhanced || !(vm.fleck > 0)) return;
  ctx.save();
  ctx.globalAlpha = vm.fleck * 0.45;
  ctx.fillStyle = COLOR.ink;
  const gy = FIGURE.ground + 14;
  ctx.beginPath();
  ctx.ellipse(FIGURE.x, gy, 8 * (1 - vm.fleck * 0.3), 3.5 * (1 - vm.fleck * 0.3), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCharacterParticles(ctx, vm) {
  if (!vm.enhanced || !(vm.fleck > 0) || vm.phase !== 'playing') return;
  const character = figureKind(vm);
  const t = 1 - vm.fleck;
  const fy = FIGURE.ground - vm.lift * 46 - 20;
  ctx.save();
  ctx.globalAlpha = vm.fleck * 0.85;

  if (character === 'ballerina') {
    ctx.font = '16px serif';
    ctx.fillStyle = vm.dress?.skirt || COLOR.skirt;
    [-18, 18].forEach((ox, i) => {
      const x = FIGURE.x + ox + (i === 0 ? -1 : 1) * t * 14;
      const y = fy - 10 - t * 30 - i * 8;
      ctx.fillText('♪', x, y);
    });
  } else if (character === 'scarecrow') {
    ctx.strokeStyle = MARKER.straw;
    ctx.lineWidth = 2;
    [-16, 0, 16].forEach((ox, i) => {
      const x = FIGURE.x + ox + Math.sin(t * 4 + i) * 12;
      const y = fy - t * 24 - i * 6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 5, y - 6);
      ctx.stroke();
    });
  } else if (character === 'pumpkin') {
    [-14, 14].forEach((ox, i) => {
      ctx.fillStyle = i === 0 ? MARKER.pumpkin : MARKER.leaf;
      const x = FIGURE.x + ox + (i === 0 ? -1 : 1) * t * 16;
      const y = fy - t * 20 - i * 5;
      ctx.beginPath();
      ctx.ellipse(x, y, 4, 2.5, i * 0.8 + t, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (character === 'samurai') {
    ctx.strokeStyle = MARKER.gold;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(FIGURE.x, fy, 26 + t * 10, -0.4, 0.4);
    ctx.stroke();
  } else if (character === 'octopus') {
    [-16, 0, 16].forEach((ox, i) => {
      ctx.fillStyle = i === 1 ? MARKER.octopus : MARKER.octopusRobe;
      const x = FIGURE.x + ox + Math.sin(t * 5 + i) * 10;
      const y = fy - t * 22 - i * 4;
      ctx.beginPath();
      ctx.ellipse(x, y, 3.5, 2.4, i * 0.6 + t, 0, Math.PI * 2);
      ctx.fill();
    });
  } else {
    ctx.fillStyle = COLOR.ink;
    [-12, 0, 12].forEach((ox, i) => {
      const x = FIGURE.x + ox + (i - 1) * t * 12;
      const y = fy - t * 26;
      ctx.beginPath();
      ctx.arc(x, y, 2.2 * (1 - t * 0.5), 0, Math.PI * 2);
      ctx.fill();
    });
  }
  ctx.restore();
}

function drawCelebrationCrown(ctx, x, y) {
  ctx.save();
  ctx.fillStyle = MARKER.gold;
  ctx.strokeStyle = COLOR.ink;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 16, y);
  ctx.lineTo(x - 20, y - 14);
  ctx.lineTo(x - 8, y - 8);
  ctx.lineTo(x, y - 18);
  ctx.lineTo(x + 8, y - 8);
  ctx.lineTo(x + 20, y - 14);
  ctx.lineTo(x + 16, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
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
    drawMangaAura(ctx, vm);
    drawFigure(ctx, vm);
    drawRope(ctx, vm, false, false);
    drawBalletShoes(ctx, vm);
    drawCharacterParticles(ctx, vm);
    drawMangaEmotes(ctx, vm);
    ctx.restore();
  }
  if (vm.fleck > 0) {
    drawFleck(ctx, vm);
    drawInkBloom(ctx, vm);
    drawMangaSfx(ctx, vm);
  }
  if (vm.landDust > 0) {
    drawLandDust(ctx, vm);
    drawImpactShockwave(ctx, vm);
  }
  if (vm.blot > 0 && vm.phase !== 'cleared' && !vm.won) {
    drawSplash(ctx, vm);
    drawMangaCrash(ctx, vm);
  }
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
    if (vm.enhanced) {
      drawCelebrationCrown(ctx, x, scoreY - (phone ? 40 : 54));
    }
  }
  if (vm.enhanced && vm.goal && ease > 0.8) {
    ctx.save();
    ctx.globalAlpha = (ease - 0.8) / 0.2;
    const barW = phone ? 120 : 160;
    const barH = 7;
    const barX = title.x - barW / 2;
    const barY = title.y + (phone ? 136 : 194);
    ctx.strokeStyle = COLOR.pencilLine;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(barX, barY, barW, barH);
    const progressW = Math.min(barW, (vm.score / vm.goal) * barW);
    if (progressW > 0) {
      ctx.fillStyle = vm.phase === 'cleared' ? COLOR.cinnabar : COLOR.pencil;
      ctx.fillRect(barX + 1.5, barY + 1.5, Math.max(0, progressW - 3), barH - 3);
    }
    ctx.restore();
  }
  ctx.restore();
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

function drawChoice(ctx, hit, phone, vm) {
  const selected = Boolean(hit.selected);
  const locked = Boolean(hit.locked);
  const cx = hit.x + hit.w / 2;
  const cy = hit.y + hit.h / 2;
  const mode = hit.id === 'infinity' || hit.id === 'levels' || hit.id === 'characters';
  const character = hit.id === 'bun' || hit.id === 'ballerina' || COSTUME_IDS.has(hit.id);
  const back = hit.id === 'back';
  ctx.save();
  ctx.globalAlpha = locked ? 0.4 : 1;
  if (vm?.enhanced && selected && !back) {
    ctx.save();
    ctx.strokeStyle = COLOR.cinnabar;
    ctx.lineWidth = 1.6;
    ctx.globalAlpha = 0.55;
    ctx.strokeRect(hit.x - 2, hit.y - 2, hit.w + 4, hit.h + 4);
    ctx.restore();
  }
  if (back) {
    paintBrushSymbol(ctx, hit, selected, locked, 'back');
  } else if (mode) {
    paintBrushSymbol(ctx, hit, selected, locked, hit.id, 0.82);
  } else if (character) {
    drawCharacterPreview(ctx, hit, hit.id, selected, locked);
  } else {
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
  if (items && items.length) items.forEach((hit) => drawChoice(ctx, hit, phone, vm));
  if (vm.exit) drawChoice(ctx, vm.exit, phone, vm);
}

function deskColor(score, enhanced) {
  if (!enhanced || !Number.isFinite(score) || score <= 0) return COLOR.desk;
  if (score < 10) return COLOR.desk;
  if (score < 25) return '#d8c2a3';
  if (score < 50) return '#d9be9b';
  return '#dbba92';
}

export function drawScene(ctx, width, height, vm, insets) {
  const phone = phoneLayout(width, height);
  const stage = stageForViewport(width, height, phone);
  const cam = camera(width, height, stage, insets);
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
  const bgColor = deskColor(vm.score, vm.enhanced);
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  if (vm.enhanced) {
    drawWoodGrain(ctx, width, height);
  }
  const shake = shakeOffset(vm);
  ctx.translate(cam.ox + shake.x, cam.oy + shake.y);
  ctx.scale(cam.s, cam.s);
  ctx.translate(PAGE.w / 2, PAGE.h / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-focusX, -focusY);
  ctx.fillStyle = bgColor;
  ctx.fillRect(-40, -40, PAGE.w + 80, PAGE.h + 80);
  if (vm.enhanced) {
    drawCoffeeRing(ctx, 840, 110, 40);
    drawDraftingPencil(ctx, 770, 520, 0.45);
    drawEraserShavings(ctx, 740, 535);
    drawColorPalette(ctx, 40, 480);
  }
  drawPage(ctx, vm);
  if (vm.enhanced) {
    drawPaperClip(ctx, 115, 30);
    drawFocusLines(ctx, PAGE.w, PAGE.h, vm);
  }
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
  if (vm.enhanced) {
    drawDeskLighting(ctx, width, height);
  }
}
