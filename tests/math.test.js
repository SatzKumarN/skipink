import { describe, expect, it } from 'vitest';
import { angleDistance, clamp, clamp01, wrapAngle } from '../src/core/math.js';

describe('clamp', () => {
  it('holds finite numbers inside the range', () => {
    expect(clamp(Number.NaN, 0, 1)).toBe(0);
    expect(clamp(-2, 0, 1)).toBe(0);
    expect(clamp(4, 0, 1)).toBe(1);
    expect(clamp(0.4, 0, 1)).toBe(0.4);
    expect(clamp01(-0.2)).toBe(0);
    expect(clamp01(0.3)).toBe(0.3);
    expect(clamp01(2)).toBe(1);
  });
});

describe('angles', () => {
  it('wraps and measures the short way around the circle', () => {
    expect(wrapAngle(Number.NaN)).toBe(0);
    expect(wrapAngle(0)).toBe(0);
    expect(wrapAngle(-Math.PI / 2)).toBeCloseTo(Math.PI * 1.5);
    expect(wrapAngle(Math.PI * 4 + 0.2)).toBeCloseTo(0.2);
    expect(angleDistance(0.1, Math.PI * 2 - 0.1)).toBeCloseTo(0.2);
    expect(angleDistance(0, Math.PI)).toBeCloseTo(Math.PI);
    expect(angleDistance(1, 1)).toBe(0);
  });
});
