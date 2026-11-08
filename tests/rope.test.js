import { describe, expect, it } from 'vitest';
import { ELLIPSE } from '../src/config.js';
import {
  BOTTOM,
  TOP,
  angularVelocity,
  ellipsePoint,
  idleAngle,
  isStitch,
  ropeProgress,
  stitchAngle,
} from '../src/core/rope.js';

describe('stitchAngle', () => {
  it('walks every mood through a full smooth turn', () => {
    expect(stitchAngle('even', 0)).toBeCloseTo(BOTTOM);
    expect(stitchAngle('even', 1)).toBeCloseTo(BOTTOM + Math.PI * 2);
    expect(stitchAngle('even', -1)).toBeCloseTo(BOTTOM);
    expect(stitchAngle('even', 2)).toBeCloseTo(BOTTOM + Math.PI * 2);

    expect(stitchAngle('hang', 0)).toBeCloseTo(BOTTOM);
    expect(stitchAngle('hang', 0.2)).toBeGreaterThan(BOTTOM);
    expect(Math.abs(stitchAngle('hang', 0.5) - TOP)).toBeLessThan(0.1);
    expect(stitchAngle('hang', 1)).toBeCloseTo(TOP + Math.PI);

    expect(stitchAngle('snap', 0.5)).toBeCloseTo(stitchAngle('even', 0.5));
    expect(stitchAngle('snap', 1)).toBeCloseTo(BOTTOM + Math.PI * 2);
    expect(stitchAngle('mystery', 0.25)).toBeCloseTo(stitchAngle('even', 0.25));
  });
});

describe('angularVelocity', () => {
  it('follows the wrist and ignores a bad gap', () => {
    expect(angularVelocity('even', 0.5, 0)).toBe(0);
    expect(angularVelocity('even', 0.5, -1)).toBe(0);
    expect(angularVelocity('even', 0.5, Number.NaN)).toBe(0);
    expect(angularVelocity('snap', 0.9, 0.5)).toBeCloseTo(angularVelocity('snap', 0.1, 0.5));
    expect(angularVelocity('hang', 0.5, 1)).toBeCloseTo(angularVelocity('hang', 0.2, 1));
    expect(angularVelocity('even', 0, 0.8)).toBeGreaterThan(0);
    expect(angularVelocity('even', 1, 0.8)).toBeGreaterThan(0);
  });
});

describe('rope geometry', () => {
  it('places the ellipse and the idle turn', () => {
    expect(ellipsePoint(0)).toEqual({ x: ELLIPSE.cx + ELLIPSE.rx, y: ELLIPSE.cy });
    expect(ellipsePoint(Math.PI / 2).y).toBeCloseTo(ELLIPSE.cy + ELLIPSE.ry);
    expect(idleAngle(Number.NaN)).toBeCloseTo(stitchAngle('even', 0));
    expect(idleAngle(-1)).toBeGreaterThan(0);
    expect(idleAngle(2.2)).toBeCloseTo(idleAngle(0));
  });

  it('tracks progress across a span and marks the stitch', () => {
    const state = { prevContact: 1, nextContact: 3, time: 2, mood: 'even' };
    expect(ropeProgress(state).u).toBeCloseTo(0.5);
    expect(ropeProgress({ ...state, time: 0 }).u).toBe(0);
    expect(ropeProgress({ ...state, time: 9 }).u).toBe(1);
    expect(ropeProgress({ ...state, nextContact: 1 }).angle).toBe(BOTTOM);
    expect(ropeProgress({ ...state, nextContact: 0 }).u).toBe(0);
    expect(isStitch(BOTTOM, BOTTOM)).toBe(true);
    expect(isStitch(BOTTOM, BOTTOM + 1)).toBe(false);
    expect(isStitch(0, 0.1, 0.2)).toBe(true);
  });
});
