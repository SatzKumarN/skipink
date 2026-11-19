import { PAGE } from '../config.js';

export const PHONE_STAGE = { x: 330, y: 0, w: 340, h: 640 };
export const LANDSCAPE_STAGE = { x: 140, y: 60, w: 680, h: 500 };

export function phoneLayout(width, height) {
  return width > 0 && ((height > width && width < 850) || (width < 600 && height >= width * 0.9));
}

export function stageForViewport(width, height, phone = phoneLayout(width, height)) {
  if (phone) return PHONE_STAGE;
  if (height > 0 && height < 520 && width > height) {
    return LANDSCAPE_STAGE;
  }
  return null;
}

export function fitCanvas(canvas, window) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, window.innerWidth || 1);
  const h = Math.max(1, window.innerHeight || 1);
  const width = Math.floor(w * dpr);
  const height = Math.floor(h * dpr);
  // Assigning either attribute clears the bitmap and resets the 2D context.
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  return { dpr, w, h };
}

export function readSafeInsets(window) {
  try {
    const style = window.getComputedStyle(window.document.documentElement);
    const num = (name) => {
      const value = parseFloat(style.getPropertyValue(name));
      return Number.isFinite(value) ? value : 0;
    };
    return {
      top: num('--sat'),
      right: num('--sar'),
      bottom: num('--sab'),
      left: num('--sal'),
    };
  } catch {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
}

export function camera(width, height, frame, insets) {
  const view = frame || { x: 0, y: 0, w: PAGE.w, h: PAGE.h };
  const pad = insets || { top: 0, right: 0, bottom: 0, left: 0 };
  const margin = (width < 360 || height < 360) ? 10 : 20;
  const w = Math.max(width - (pad.left || 0) - (pad.right || 0), margin * 2 + 1);
  const h = Math.max(height - (pad.top || 0) - (pad.bottom || 0), margin * 2 + 1);
  const s = Math.min((w - margin * 2) / view.w, (h - margin * 2) / view.h);
  return {
    s,
    ox: (pad.left || 0) + (w - view.w * s) / 2 - view.x * s,
    oy: (pad.top || 0) + (h - view.h * s) / 2 - view.y * s,
  };
}
