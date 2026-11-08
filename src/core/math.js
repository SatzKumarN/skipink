const TAU = Math.PI * 2;

export function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function clamp01(value) {
  return clamp(value, 0, 1);
}

export function wrapAngle(angle) {
  if (!Number.isFinite(angle)) return 0;
  return ((angle % TAU) + TAU) % TAU;
}

export function angleDistance(a, b) {
  const d = Math.abs(wrapAngle(a) - wrapAngle(b));
  return Math.min(d, TAU - d);
}
