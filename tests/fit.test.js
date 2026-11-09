import { describe, expect, it } from 'vitest';
import { camera, fitCanvas, readSafeInsets } from '../src/render/fit.js';

describe('fitCanvas', () => {
  it('sizes the backing store from the window and caps the pixel ratio', () => {
    const canvas = { style: {} };
    const fitted = fitCanvas(canvas, { devicePixelRatio: 4, innerWidth: 800, innerHeight: 600 });
    expect(fitted).toEqual({ dpr: 2, w: 800, h: 600 });
    expect(canvas.width).toBe(1600);
    expect(canvas.height).toBe(1200);
    expect(canvas.style.width).toBe('800px');

    const fallback = fitCanvas(canvas, { devicePixelRatio: 0, innerWidth: 0, innerHeight: 0 });
    expect(fallback).toEqual({ dpr: 1, w: 1, h: 1 });
    const normal = fitCanvas(canvas, { devicePixelRatio: 1.5, innerWidth: 320, innerHeight: 240 });
    expect(normal.dpr).toBe(1.5);
    expect(fitCanvas(canvas, { innerWidth: 20, innerHeight: 20 }).dpr).toBe(1);
  });

  it('writes the backing store only when the size or pixel ratio changes it', () => {
    const writes = [];
    const canvas = {
      style: {},
      width: 0,
      height: 0,
    };
    const track = (key) => {
      let value = canvas[key];
      Object.defineProperty(canvas, key, {
        configurable: true,
        get: () => value,
        set: (next) => {
          writes.push([key, next]);
          value = next;
        },
      });
    };
    track('width');
    track('height');

    fitCanvas(canvas, { devicePixelRatio: 2, innerWidth: 800, innerHeight: 600 });
    expect(writes).toEqual([['width', 1600], ['height', 1200]]);
    writes.length = 0;

    const held = fitCanvas(canvas, { devicePixelRatio: 2, innerWidth: 800, innerHeight: 600 });
    expect(held).toEqual({ dpr: 2, w: 800, h: 600 });
    expect(writes).toEqual([]);
    expect(canvas.style).toEqual({ width: '800px', height: '600px' });

    fitCanvas(canvas, { devicePixelRatio: 2, innerWidth: 800.4, innerHeight: 600 });
    expect(writes).toEqual([]);
    expect(canvas.style.width).toBe('800.4px');
    writes.length = 0;

    fitCanvas(canvas, { devicePixelRatio: 2, innerWidth: 801, innerHeight: 600 });
    expect(writes).toEqual([['width', 1602]]);
    writes.length = 0;

    fitCanvas(canvas, { devicePixelRatio: 2, innerWidth: 801, innerHeight: 601 });
    expect(writes).toEqual([['height', 1202]]);
    writes.length = 0;

    fitCanvas(canvas, { devicePixelRatio: 1, innerWidth: 801, innerHeight: 601 });
    expect(writes).toEqual([['width', 801], ['height', 601]]);
  });
});

describe('camera', () => {
  it('fits the page inside the view and keeps a tiny view drawable', () => {
    const wide = camera(1000, 700);
    expect(wide.s).toBeCloseTo(1);
    expect(wide.ox).toBeCloseTo(20);
    const tall = camera(400, 900);
    expect(tall.s).toBeLessThan(1);
    expect(tall.oy).toBeGreaterThan(0);
    const tiny = camera(10, 10);
    expect(tiny.s).toBeGreaterThan(0);
    const framed = camera(390, 844, { x: 330, y: 0, w: 340, h: 640 }, {
      top: 40, right: 0, bottom: 20, left: 0,
    });
    expect(framed.s).toBeGreaterThan(camera(390, 844).s);
    expect(framed.oy).toBeGreaterThan(0);
  });
});

describe('readSafeInsets', () => {
  it('reads the safe-area variables and survives a missing document', () => {
    const style = { getPropertyValue: (name) => (name === '--sat' ? '47px' : 'nope') };
    const win = {
      document: { documentElement: {} },
      getComputedStyle: () => style,
    };
    expect(readSafeInsets(win)).toEqual({ top: 47, right: 0, bottom: 0, left: 0 });
    expect(readSafeInsets({ getComputedStyle: () => { throw new Error('no'); } })).toEqual({
      top: 0, right: 0, bottom: 0, left: 0,
    });
  });
});
