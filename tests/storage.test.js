import { describe, expect, it } from 'vitest';
import {
  CHARACTER_STORAGE_KEY,
  DEFAULT_CHARACTER,
  DEFAULT_VIEW,
  DRESS_STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  LEVEL_STORAGE_KEY,
  STORAGE_KEY,
  VIEW_STORAGE_KEY,
} from '../src/config.js';
import {
  readBest,
  readCharacter,
  readCleared,
  readDress,
  readView,
  resolveCharacter,
  resolveView,
  unlockedLevel,
  writeBest,
  writeCharacter,
  writeCleared,
  writeDress,
  writeView,
} from '../src/storage.js';

function memory(initial) {
  const values = new Map(initial);
  return {
    values,
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

describe('best count', () => {
  it('reads a whole positive count and ignores junk', () => {
    const store = memory([[STORAGE_KEY, '4.9']]);
    expect(readBest(store)).toBe(4);
    store.values.set(STORAGE_KEY, '0');
    expect(readBest(store)).toBe(0);
    store.values.set(STORAGE_KEY, '-2');
    expect(readBest(store)).toBe(0);
    store.values.set(STORAGE_KEY, 'nope');
    expect(readBest(store)).toBe(0);
    store.values.delete(STORAGE_KEY);
    expect(readBest(store)).toBe(0);
    expect(readBest({ getItem: () => { throw new Error('blocked'); } })).toBe(0);
  });

  it('writes a whole count and survives a blocked store', () => {
    const store = memory([]);
    expect(writeBest(store, 3.7)).toBe(3);
    expect(store.values.get(STORAGE_KEY)).toBe('3');
    expect(writeBest(store, 0)).toBe(0);
    expect(writeBest(store, Number.NaN)).toBe(0);
    expect(writeBest({ setItem: () => { throw new Error('blocked'); } }, 8)).toBe(0);
  });

  it('keeps a best saved under the old project name', () => {
    const moved = memory([[LEGACY_STORAGE_KEY, '8']]);
    expect(readBest(moved)).toBe(8);
    expect(moved.values.get(STORAGE_KEY)).toBe('8');
    expect(moved.values.has(LEGACY_STORAGE_KEY)).toBe(false);

    const kept = memory([
      [STORAGE_KEY, '5'],
      [LEGACY_STORAGE_KEY, '9'],
    ]);
    expect(readBest(kept)).toBe(5);
    expect(kept.values.get(LEGACY_STORAGE_KEY)).toBe('9');

    const stuck = memory([[LEGACY_STORAGE_KEY, '3']]);
    stuck.setItem = () => { throw new Error('blocked'); };
    expect(readBest(stuck)).toBe(3);
    expect(stuck.values.has(STORAGE_KEY)).toBe(false);

    const quiet = memory([[LEGACY_STORAGE_KEY, '2']]);
    delete quiet.removeItem;
    expect(readBest(quiet)).toBe(2);
    expect(quiet.values.get(STORAGE_KEY)).toBe('2');
    expect(quiet.values.get(LEGACY_STORAGE_KEY)).toBe('2');
  });
});

describe('level progress', () => {
  it('reads and writes how many levels are cleared', () => {
    const store = memory([[LEVEL_STORAGE_KEY, '4.2']]);
    expect(readCleared(store)).toBe(4);
    expect(unlockedLevel(4)).toBe(5);
    expect(writeCleared(store, 6.8)).toBe(6);
    expect(store.values.get(LEVEL_STORAGE_KEY)).toBe('6');
    expect(writeCleared(store, -1)).toBe(0);
    expect(writeCleared(store, 99)).toBe(10);
    expect(readCleared({ getItem: () => { throw new Error('blocked'); } })).toBe(0);
    expect(writeCleared({ setItem: () => { throw new Error('blocked'); } }, 3)).toBe(0);
    expect(unlockedLevel(0)).toBe(1);
    expect(unlockedLevel(10)).toBe(10);
  });
});

describe('character choice', () => {
  it('reads and writes a known skipper', () => {
    expect(resolveCharacter('ballerina')).toBe('ballerina');
    expect(resolveCharacter('scarecrow')).toBe('scarecrow');
    expect(resolveCharacter('pumpkin')).toBe('pumpkin');
    expect(resolveCharacter('samurai')).toBe('samurai');
    expect(resolveCharacter('nope')).toBe(DEFAULT_CHARACTER);
    expect(resolveCharacter(null)).toBe(DEFAULT_CHARACTER);
    const store = memory([[CHARACTER_STORAGE_KEY, 'ballerina']]);
    expect(readCharacter(store)).toBe('ballerina');
    expect(writeCharacter(store, 'bun')).toBe('bun');
    expect(store.values.get(CHARACTER_STORAGE_KEY)).toBe('bun');
    expect(writeCharacter(store, 'mystery')).toBe(DEFAULT_CHARACTER);
    expect(readCharacter({ getItem: () => { throw new Error('blocked'); } })).toBe(DEFAULT_CHARACTER);
    expect(writeCharacter({ setItem: () => { throw new Error('blocked'); } }, 'ballerina'))
      .toBe(DEFAULT_CHARACTER);
  });
});

describe('view preference', () => {
  it('reads and writes view mode, defaulting to classic', () => {
    expect(resolveView('enhanced')).toBe('enhanced');
    expect(resolveView('classic')).toBe('classic');
    expect(resolveView('other')).toBe(DEFAULT_VIEW);
    expect(resolveView(null)).toBe(DEFAULT_VIEW);

    const store = memory([[VIEW_STORAGE_KEY, 'enhanced']]);
    expect(readView(store)).toBe('enhanced');
    expect(writeView(store, 'classic')).toBe('classic');
    expect(store.values.get(VIEW_STORAGE_KEY)).toBe('classic');
    expect(writeView(store, 'invalid')).toBe(DEFAULT_VIEW);
    expect(readView({ getItem: () => { throw new Error('blocked'); } })).toBe(DEFAULT_VIEW);
    expect(writeView({ setItem: () => { throw new Error('blocked'); } }, 'enhanced'))
      .toBe(DEFAULT_VIEW);
  });
});

describe('dress preference', () => {
  it('reads and writes dress index with wrap-around', () => {
    const store = memory([[DRESS_STORAGE_KEY, '2']]);
    expect(readDress(store)).toBe(2);
    expect(writeDress(store, 4)).toBe(4);
    expect(store.values.get(DRESS_STORAGE_KEY)).toBe('4');
    expect(writeDress(store, 'invalid')).toBe(0);
    expect(readDress(memory([[DRESS_STORAGE_KEY, 'invalid']]))).toBe(0);
    expect(readDress({ getItem: () => { throw new Error('blocked'); } })).toBe(0);
    expect(writeDress({ setItem: () => { throw new Error('blocked'); } }, 2)).toBe(0);
  });
});
