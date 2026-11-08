import { STORAGE_KEY } from './config.js';

export function readBest(storage) {
  try {
    const value = Number(storage.getItem(STORAGE_KEY));
    if (!Number.isFinite(value) || value <= 0) return 0;
    return Math.floor(value);
  } catch {
    return 0;
  }
}

export function writeBest(storage, best) {
  try {
    const safe = Number.isFinite(best) && best > 0 ? Math.floor(best) : 0;
    storage.setItem(STORAGE_KEY, String(safe));
    return safe;
  } catch {
    return 0;
  }
}
