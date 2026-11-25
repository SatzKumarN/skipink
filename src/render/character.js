import { COLOR, MARKER } from '../config.js';

export function drawBunFaceAndRibbon(ctx, vm, hx, hy) {
  const clock = vm?.clock || 0;
  const lift = vm?.lift || 0;
  const streak = vm?.streak || 0;
  const mood = vm?.mood || 'even';

  ctx.save();

  // 1. Warm ivory anime face disk inside the black head outline
  ctx.fillStyle = '#fff8f0';
  ctx.beginPath();
  ctx.arc(hx, hy + 1.5, 8.4, 0, Math.PI * 2);
  ctx.fill();

  // 2. Rosy anime cheek blush
  ctx.strokeStyle = '#ff708d';
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  [-4.5, 4.5].forEach((bx) => {
    ctx.beginPath();
    ctx.moveTo(hx + bx - 1, hy + 3.8);
    ctx.lineTo(hx + bx + 1, hy + 2.6);
    ctx.moveTo(hx + bx, hy + 4.6);
    ctx.lineTo(hx + bx + 2, hy + 3.4);
    ctx.stroke();
  });

  // 3. Expressive anime eyes
  ctx.fillStyle = COLOR.ink;
  ctx.strokeStyle = COLOR.ink;
  ctx.lineWidth = 1.3;

  if (mood === 'snap') {
    // Focused/determined squint > <
    ctx.beginPath();
    ctx.moveTo(hx - 5, hy - 0.5);
    ctx.lineTo(hx - 2.5, hy + 0.5);
    ctx.lineTo(hx - 5, hy + 1.5);
    ctx.moveTo(hx + 5, hy - 0.5);
    ctx.lineTo(hx + 2.5, hy + 0.5);
    ctx.lineTo(hx + 5, hy + 1.5);
    ctx.stroke();
  } else if (lift > 0.08 || streak >= 4) {
    // Happy jumping/high streak crescent eyes ^ ^
    ctx.beginPath();
    ctx.arc(hx - 3.5, hy + 1.2, 2.2, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(hx + 3.5, hy + 1.2, 2.2, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  } else {
    // Default glossy anime eyes with catchlight highlight
    [-3.5, 3.5].forEach((ex) => {
      ctx.beginPath();
      ctx.arc(hx + ex, hy + 0.8, 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(hx + ex + 0.5, hy + 0.4, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLOR.ink;
    });
  }

  // 4. Subtle anime smile
  ctx.beginPath();
  ctx.arc(hx, hy + 3.8, 2.2, 0.2, Math.PI - 0.2);
  ctx.stroke();

  // 5. Cinnabar red ribbon bow on hair bun with fluttering tails
  const knotX = hx - 1;
  const knotY = hy - 8.5;
  const wave1 = Math.sin(clock * 8) * 3 - lift * 5;
  const wave2 = Math.cos(clock * 7) * 3 - lift * 4;

  ctx.fillStyle = COLOR.cinnabar;
  ctx.strokeStyle = COLOR.cinnabar;
  ctx.lineWidth = 1.8;

  // Ribbon knot
  ctx.beginPath();
  ctx.ellipse(knotX, knotY, 2.4, 1.8, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Bow loops
  ctx.beginPath();
  ctx.ellipse(knotX - 3.5, knotY - 1, 3.2, 2, -0.4, 0, Math.PI * 2);
  ctx.ellipse(knotX + 3.5, knotY - 1, 3.2, 2, 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Fluttering ribbon tails
  ctx.beginPath();
  ctx.moveTo(knotX - 1, knotY + 1);
  ctx.quadraticCurveTo(knotX - 7, knotY + 4 + wave1 * 0.5, knotX - 9 + wave1, knotY + 11);
  ctx.moveTo(knotX + 1, knotY + 1);
  ctx.quadraticCurveTo(knotX - 4, knotY + 5 + wave2 * 0.5, knotX - 5 + wave2, knotY + 13);
  ctx.stroke();

  ctx.restore();
}

export function drawBallerinaFaceAndTiara(ctx, vm, hx, hy) {
  const clock = vm?.clock || 0;
  const lift = vm?.lift || 0;
  const streak = vm?.streak || 0;

  ctx.save();

  // 1. Soft ivory anime face disk
  ctx.fillStyle = '#fff8f0';
  ctx.beginPath();
  ctx.arc(hx, hy + 1, 9.8, 0, Math.PI * 2);
  ctx.fill();

  // 2. Rosy anime blush
  ctx.strokeStyle = '#ff708d';
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  [-5, 5].forEach((bx) => {
    ctx.beginPath();
    ctx.moveTo(hx + bx - 1, hy + 3.6);
    ctx.lineTo(hx + bx + 1, hy + 2.4);
    ctx.stroke();
  });

  // 3. Delicate anime eyes with upper lashes
  ctx.fillStyle = COLOR.ink;
  ctx.strokeStyle = COLOR.ink;
  ctx.lineWidth = 1.3;

  if (lift > 0.08 || streak >= 4) {
    // Happy singing/jumping closed curved eyes with lashes
    [-4, 4].forEach((ex, idx) => {
      ctx.beginPath();
      ctx.arc(hx + ex, hy + 0.8, 2.4, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
      // Eyelash flick
      ctx.beginPath();
      ctx.moveTo(hx + ex + (idx === 0 ? -2.2 : 2.2), hy + 0.6);
      ctx.lineTo(hx + ex + (idx === 0 ? -3.8 : 3.8), hy - 0.6);
      ctx.stroke();
    });
  } else {
    // Delicate open eyes with lashes
    [-4, 4].forEach((ex, idx) => {
      ctx.beginPath();
      ctx.arc(hx + ex, hy + 0.6, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(hx + ex + 0.5, hy + 0.2, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLOR.ink;
      // Lash flick
      ctx.beginPath();
      ctx.moveTo(hx + ex + (idx === 0 ? -1.5 : 1.5), hy - 0.4);
      ctx.lineTo(hx + ex + (idx === 0 ? -3 : 3), hy - 1.6);
      ctx.stroke();
    });
  }

  // 4. Subtle smile
  ctx.beginPath();
  ctx.arc(hx, hy + 3.8, 2.2, 0.2, Math.PI - 0.2);
  ctx.stroke();

  // 5. Golden tiara on hair bun with glinting center star
  const tiaraX = hx + 2.2;
  const tiaraY = hy - 13.5;
  ctx.fillStyle = MARKER.gold;
  ctx.beginPath();
  ctx.moveTo(tiaraX - 6, tiaraY + 2);
  ctx.lineTo(tiaraX - 4, tiaraY - 3);
  ctx.lineTo(tiaraX - 1.5, tiaraY);
  ctx.lineTo(tiaraX, tiaraY - 5);
  ctx.lineTo(tiaraX + 1.5, tiaraY);
  ctx.lineTo(tiaraX + 4, tiaraY - 3);
  ctx.lineTo(tiaraX + 6, tiaraY + 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = COLOR.ink;
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Center jewel sparkle glint
  const glint = Math.sin(clock * 6) * 0.5 + 0.5;
  if (glint > 0.4) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(tiaraX, tiaraY - 5, 1.2 * glint, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawSamuraiFeatures(ctx, vm, frame) {
  const clock = vm?.clock || 0;
  const streak = vm?.streak || 0;
  const { hx, hy, neck } = frame;

  ctx.save();

  // 1. Glowing golden/white warrior slit eyes beneath kabuto visor
  const eyeY = hy + 4;
  ctx.fillStyle = MARKER.gold;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.4;

  [-4, 4].forEach((ex) => {
    ctx.beginPath();
    ctx.ellipse(hx + ex, eyeY, 2.4, 1.1, ex < 0 ? -0.2 : 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  // Anime warrior eye flare trail on high streak
  if (streak >= 6) {
    ctx.strokeStyle = MARKER.gold;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(hx - 5.5, eyeY);
    ctx.lineTo(hx - 12 - Math.sin(clock * 10) * 3, eyeY - 2);
    ctx.moveTo(hx + 5.5, eyeY);
    ctx.lineTo(hx + 12 + Math.sin(clock * 10) * 3, eyeY - 2);
    ctx.stroke();
  }

  // 2. Kuwagata crest horn glint
  const crestX = hx;
  const crestY = hy - 38;
  const glint = Math.sin(clock * 5) * 0.5 + 0.5;
  if (glint > 0.35) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(crestX, crestY, 1.6 * glint, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Flowing samurai sash ribbons at waist
  const waistY = neck + 24;
  const wave = Math.sin(clock * 7) * 4;
  ctx.strokeStyle = MARKER.helmRed;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(hx - 2, waistY + 4);
  ctx.quadraticCurveTo(hx - 8, waistY + 12, hx - 12 + wave, waistY + 22);
  ctx.moveTo(hx + 2, waistY + 4);
  ctx.quadraticCurveTo(hx - 4, waistY + 14, hx - 7 + wave * 0.8, waistY + 24);
  ctx.stroke();

  ctx.restore();
}

export function drawPumpkinFeatures(ctx, vm, frame) {
  const clock = vm?.clock || 0;
  const streak = vm?.streak || 0;
  const { hx, hy } = frame;
  const flicker = 0.82 + Math.sin(clock * 11) * 0.18;

  ctx.save();
  ctx.globalAlpha = flicker;

  // Warm glowing candlefire ember light inside carved eyes
  ctx.fillStyle = '#ffe066';
  [-1, 1].forEach((sign) => {
    ctx.beginPath();
    ctx.moveTo(hx + sign * 12, hy - 11);
    ctx.lineTo(hx + sign * 5, hy - 11);
    ctx.lineTo(hx + sign * 8.5, hy - 4);
    ctx.closePath();
    ctx.fill();
  });

  // Nose ember
  ctx.beginPath();
  ctx.moveTo(hx - 2.2, hy - 1.5);
  ctx.lineTo(hx + 2.2, hy - 1.5);
  ctx.lineTo(hx, hy + 3);
  ctx.closePath();
  ctx.fill();

  // Jagged mouth warm ember fill
  ctx.beginPath();
  ctx.moveTo(hx - 10, hy + 7);
  ctx.lineTo(hx - 6, hy + 11);
  ctx.lineTo(hx - 2, hy + 7);
  ctx.lineTo(hx, hy + 11);
  ctx.lineTo(hx + 2, hy + 7);
  ctx.lineTo(hx + 6, hy + 11);
  ctx.lineTo(hx + 10, hy + 7);
  ctx.lineTo(hx + 8, hy + 13);
  ctx.lineTo(hx, hy + 9.5);
  ctx.lineTo(hx - 8, hy + 13);
  ctx.closePath();
  ctx.fill();

  // Glowing spark drifting from stem when streak >= 4
  if (streak >= 4) {
    const sparkY = hy - 44 - (clock * 20) % 18;
    const sparkX = hx + 12 + Math.sin(clock * 6) * 4;
    ctx.fillStyle = '#ffb703';
    ctx.beginPath();
    ctx.arc(sparkX, sparkY, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function drawScarecrowFeatures(ctx, vm, frame) {
  const { hx, hy } = frame;

  ctx.save();

  // 1. Cute stitched button cross eyes on burlap face
  ctx.strokeStyle = COLOR.ink;
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';

  [-5.5, 5.5].forEach((ex) => {
    const eyeY = hy + 8.5;
    ctx.beginPath();
    ctx.moveTo(hx + ex - 1.8, eyeY - 1.8);
    ctx.lineTo(hx + ex + 1.8, eyeY + 1.8);
    ctx.moveTo(hx + ex + 1.8, eyeY - 1.8);
    ctx.lineTo(hx + ex - 1.8, eyeY + 1.8);
    ctx.stroke();
  });

  // 2. Stitched burlap smile with suture marks
  const smileY = hy + 14.5;
  ctx.beginPath();
  ctx.arc(hx, smileY - 2, 7, 0.4, Math.PI - 0.4);
  ctx.stroke();

  // Vertical stitches
  [-4, -1.5, 1.5, 4].forEach((sx) => {
    ctx.beginPath();
    ctx.moveTo(hx + sx, smileY + 1.5);
    ctx.lineTo(hx + sx, smileY + 5);
    ctx.stroke();
  });

  // 3. Crow feather in hat band with cinnabar bead
  const featherX = hx + 13;
  const featherY = hy - 6;
  ctx.fillStyle = COLOR.ink;
  ctx.beginPath();
  ctx.moveTo(featherX, featherY);
  ctx.quadraticCurveTo(featherX + 8, featherY - 14, featherX + 16, featherY - 20);
  ctx.quadraticCurveTo(featherX + 10, featherY - 10, featherX + 3, featherY + 2);
  ctx.closePath();
  ctx.fill();

  // Bead
  ctx.fillStyle = COLOR.cinnabar;
  ctx.beginPath();
  ctx.arc(featherX + 1, featherY + 1, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function drawEnhancedFigure(ctx, vm, spec, character, colors) {
  if (!vm?.enhanced) return;
  const [sx] = spec.skirt;
  const [, hy] = spec.head;
  if (character === 'ballerina') {
    drawBallerinaFaceAndTiara(ctx, vm, sx, hy);
  } else {
    drawBunFaceAndRibbon(ctx, vm, sx, hy);
  }
}

export function drawEnhancedCostume(ctx, vm, frame, character, colors) {
  if (!vm?.enhanced) return;
  if (character === 'pumpkin') {
    drawPumpkinFeatures(ctx, vm, frame);
  } else if (character === 'samurai') {
    drawSamuraiFeatures(ctx, vm, frame);
  } else if (character === 'scarecrow') {
    drawScarecrowFeatures(ctx, vm, frame);
  }
}
