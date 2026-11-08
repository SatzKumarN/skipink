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
