import { describe, expect, it } from 'vitest';
import {
  drawCoffeeRing,
  drawColorPalette,
  drawDeskLighting,
  drawDraftingPencil,
  drawEraserShavings,
  drawPaperClip,
  drawWoodGrain,
} from '../src/render/desk.js';
import { mockContext } from './helpers/mockContext.js';

describe('desk world', () => {
  it('draws wood grain bezier curves across the desk', () => {
    const ctx = mockContext();
    drawWoodGrain(ctx, 960, 640);
    expect(ctx.calls.some((call) => call[0] === 'bezierCurveTo')).toBe(true);
    expect(ctx.calls.some((call) => call[0] === 'stroke')).toBe(true);
  });

  it('draws coffee ring with wobble and inner rim', () => {
    const ctx = mockContext();
    drawCoffeeRing(ctx, 500, 300, 40);
    expect(ctx.calls.some((call) => call[0] === 'closePath')).toBe(true);
    expect(ctx.calls.some((call) => call[0] === 'stroke')).toBe(true);
  });

  it('draws drafting pencil with body, ferrule, eraser, and graphite tip', () => {
    const ctx = mockContext();
    drawDraftingPencil(ctx, 200, 200, 0.5);
    expect(ctx.calls.some((call) => call[0] === 'fillRect')).toBe(true);
    expect(ctx.calls.some((call) => call[0] === 'roundRect')).toBe(true);
    expect(ctx.calls.some((call) => call[0] === 'fill')).toBe(true);
  });

  it('draws eraser shavings and paper clip', () => {
    const shavingsCtx = mockContext();
    drawEraserShavings(shavingsCtx, 100, 100);
    expect(shavingsCtx.calls.some((call) => call[0] === 'arc')).toBe(true);

    const clipCtx = mockContext();
    drawPaperClip(clipCtx, 50, 50);
    expect(clipCtx.calls.some((call) => call[0] === 'stroke')).toBe(true);
  });

  it('draws character color palette and desk lighting vignette', () => {
    const paletteCtx = mockContext();
    drawColorPalette(paletteCtx, 100, 100);
    expect(paletteCtx.calls.filter((call) => call[0] === 'fill').length).toBeGreaterThan(6);

    const lightCtx = mockContext();
    drawDeskLighting(lightCtx, 960, 640);
    expect(lightCtx.calls.some((call) => call[0] === 'createRadialGradient')).toBe(true);
    expect(lightCtx.calls.some((call) => call[0] === 'fillRect')).toBe(true);
  });
});
