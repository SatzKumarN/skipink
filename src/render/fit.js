import { PAGE } from '../config.js';

export function fitCanvas(canvas, window) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.max(1, window.innerWidth || 1);
  const h = Math.max(1, window.innerHeight || 1);
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
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
  const margin = 20;
  const w = Math.max(width - (pad.left || 0) - (pad.right || 0), margin * 2 + 1);
  const h = Math.max(height - (pad.top || 0) - (pad.bottom || 0), margin * 2 + 1);
  const s = Math.min((w - margin * 2) / view.w, (h - margin * 2) / view.h);
  return {
    s,
    ox: (pad.left || 0) + (w - view.w * s) / 2 - view.x * s,
    oy: (pad.top || 0) + (h - view.h * s) / 2 - view.y * s,
  };
}
