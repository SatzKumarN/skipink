import { describe, expect, it } from 'vitest';
import { LEGACY_STORAGE_KEY, STORAGE_KEY } from '../src/config.js';
import { readBest, writeBest } from '../src/storage.js';

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
