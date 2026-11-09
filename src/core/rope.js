import { ELLIPSE } from '../config.js';
import { angleDistance, clamp01 } from './math.js';

export const BOTTOM = Math.PI / 2;
export const TOP = Math.PI * 1.5;
const PERIOD = 2.2;

export function stitchAngle(u) {
  const t = clamp01(u);
  return BOTTOM + t * Math.PI * 2;
}

export function angularVelocity(u, gap) {
  if (!Number.isFinite(gap) || gap <= 0) return 0;
  const du = 0.01;
  const left = stitchAngle(Math.max(0, u - du));
  const right = stitchAngle(Math.min(1, u + du));
  return (right - left) / (du * 2) / gap;
}

export function ellipsePoint(angle) {
  return {
    x: ELLIPSE.cx + Math.cos(angle) * ELLIPSE.rx,
    y: ELLIPSE.cy + Math.sin(angle) * ELLIPSE.ry,
  };
}

export function idleAngle(clock) {
  const t = Number.isFinite(clock) ? clock : 0;
  const wrapped = ((t % PERIOD) + PERIOD) % PERIOD;
  return stitchAngle(wrapped / PERIOD);
}

export function ropeProgress(state) {
  const span = state.nextContact - state.prevContact;
  if (!(span > 0)) {
    return { u: 0, mood: state.mood, angle: BOTTOM };
  }
  const u = clamp01((state.time - state.prevContact) / span);
  return { u, mood: state.mood, angle: stitchAngle(u) };
}

export function isStitch(angle, stitch, width = 0.22) {
  return angleDistance(angle, stitch) < width;
}
