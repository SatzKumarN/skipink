import { describe, expect, it } from 'vitest';
import { STORAGE_KEY } from '../src/config.js';
import { readBest, writeBest } from '../src/storage.js';

function memory(initial) {
  const values = new Map(initial);
  return {
    values,
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => values.set(key, value),
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
});
