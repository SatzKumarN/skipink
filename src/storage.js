import { LEGACY_STORAGE_KEY, STORAGE_KEY } from './config.js';

function wholeCount(raw) {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.floor(value);
}

export function readBest(storage) {
  try {
    const current = wholeCount(storage.getItem(STORAGE_KEY));
    if (current > 0) return current;
    const legacy = wholeCount(storage.getItem(LEGACY_STORAGE_KEY));
    if (legacy > 0) {
      try {
        storage.setItem(STORAGE_KEY, String(legacy));
        if (typeof storage.removeItem === 'function') storage.removeItem(LEGACY_STORAGE_KEY);
      } catch {
        // Keep the count when the renamed key cannot be written.
      }
    }
    return legacy;
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
