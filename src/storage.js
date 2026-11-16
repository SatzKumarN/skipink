import {
  CHARACTERS,
  CHARACTER_STORAGE_KEY,
  CUSTOM_CHAR_STORAGE_KEY,
  DEFAULT_CHARACTER,
  DEFAULT_VIEW,
  DRESS_STORAGE_KEY,
  DRESSES,
  LEGACY_STORAGE_KEY,
  LEVEL_STORAGE_KEY,
  LEVELS,
  STORAGE_KEY,
  VIEW_MODES,
  VIEW_STORAGE_KEY,
} from './config.js';

function wholeCount(raw) {
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.floor(value);
}

function clampCleared(raw) {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(LEVELS.length, Math.floor(value));
}

export function resolveCharacter(id) {
  const key = typeof id === 'string' ? id : '';
  if (key === 'custom') return 'custom';
  return CHARACTERS.some((choice) => choice.id === key) ? key : DEFAULT_CHARACTER;
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

export function readCleared(storage) {
  try {
    return clampCleared(storage.getItem(LEVEL_STORAGE_KEY));
  } catch {
    return 0;
  }
}

export function writeCleared(storage, cleared) {
  try {
    const safe = clampCleared(cleared);
    storage.setItem(LEVEL_STORAGE_KEY, String(safe));
    return safe;
  } catch {
    return 0;
  }
}

export function unlockedLevel(cleared) {
  return Math.min(LEVELS.length, clampCleared(cleared) + 1);
}

export function readCharacter(storage) {
  try {
    return resolveCharacter(storage.getItem(CHARACTER_STORAGE_KEY));
  } catch {
    return DEFAULT_CHARACTER;
  }
}

export function writeCharacter(storage, character) {
  try {
    const safe = resolveCharacter(character);
    storage.setItem(CHARACTER_STORAGE_KEY, safe);
    return safe;
  } catch {
    return DEFAULT_CHARACTER;
  }
}

export function resolveView(id) {
  const key = typeof id === 'string' ? id : '';
  return VIEW_MODES.includes(key) ? key : DEFAULT_VIEW;
}

export function readView(storage) {
  try {
    return resolveView(storage.getItem(VIEW_STORAGE_KEY));
  } catch {
    return DEFAULT_VIEW;
  }
}

export function writeView(storage, view) {
  try {
    const safe = resolveView(view);
    storage.setItem(VIEW_STORAGE_KEY, safe);
    return safe;
  } catch {
    return DEFAULT_VIEW;
  }
}

export function readDress(storage) {
  try {
    const raw = Number(storage.getItem(DRESS_STORAGE_KEY));
    if (!Number.isFinite(raw)) return 0;
    return ((Math.floor(raw) % DRESSES.length) + DRESSES.length) % DRESSES.length;
  } catch {
    return 0;
  }
}

export function writeDress(storage, dress) {
  try {
    const raw = Number(dress);
    const safe = Number.isFinite(raw)
      ? ((Math.floor(raw) % DRESSES.length) + DRESSES.length) % DRESSES.length
      : 0;
    storage.setItem(DRESS_STORAGE_KEY, String(safe));
    return safe;
  } catch {
    return 0;
  }
}

export function readCustomCharacter(storage) {
  try {
    const item = storage.getItem(CUSTOM_CHAR_STORAGE_KEY);
    return typeof item === 'string' && item.startsWith('data:image/') ? item : null;
  } catch {
    return null;
  }
}

export function writeCustomCharacter(storage, dataUrl) {
  try {
    if (typeof dataUrl === 'string' && dataUrl.startsWith('data:image/')) {
      storage.setItem(CUSTOM_CHAR_STORAGE_KEY, dataUrl);
      return dataUrl;
    }
    return null;
  } catch {
    return null;
  }
}
