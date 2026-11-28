import { describe, expect, it } from 'vitest';
import {
  drawBallerinaFaceAndTiara,
  drawBunFaceAndRibbon,
  drawEnhancedCostume,
  drawEnhancedFigure,
  drawOctopusFeatures,
  drawPumpkinFeatures,
  drawSamuraiFeatures,
  drawScarecrowFeatures,
} from '../src/render/character.js';
import { mockContext } from './helpers/mockContext.js';

describe('character enhancements', () => {
  const dummySpec = {
    head: [0, -100],
    skirt: [0, -54, 28, 42],
  };
  const dummyFrame = {
    hx: 0,
    hy: -100,
    neck: -84,
    hem: -6,
  };

  describe('drawBunFaceAndRibbon', () => {
    it('draws default glossy anime eyes and fluttering ribbon', () => {
      const ctx = mockContext();
      drawBunFaceAndRibbon(ctx, { enhanced: true }, 0, -100);
      expect(ctx.calls.some((c) => c[0] === 'ellipse')).toBe(true);
      expect(ctx.calls.some((c) => c[0] === 'arc')).toBe(true);
      expect(ctx.calls.some((c) => c[0] === 'stroke')).toBe(true);
    });

    it('draws focused squint eyes on snap mood', () => {
      const ctx = mockContext();
      drawBunFaceAndRibbon(ctx, { enhanced: true, mood: 'snap' }, 0, -100);
      expect(ctx.calls.some((c) => c[0] === 'lineTo')).toBe(true);
    });

    it('draws happy crescent eyes on jump lift or high streak', () => {
      const ctxLift = mockContext();
      drawBunFaceAndRibbon(ctxLift, { enhanced: true, lift: 0.5 }, 0, -100);
      expect(ctxLift.calls.some((c) => c[0] === 'arc')).toBe(true);

      const ctxStreak = mockContext();
      drawBunFaceAndRibbon(ctxStreak, { enhanced: true, streak: 6 }, 0, -100);
      expect(ctxStreak.calls.some((c) => c[0] === 'arc')).toBe(true);
    });
  });

  describe('drawBallerinaFaceAndTiara', () => {
    it('draws delicate open eyes and sparkling tiara', () => {
      const ctx = mockContext();
      drawBallerinaFaceAndTiara(ctx, { enhanced: true, clock: 0.25 }, 0, -100);
      expect(ctx.calls.some((c) => c[0] === 'fill')).toBe(true);
      expect(ctx.calls.some((c) => c[0] === 'stroke')).toBe(true);
    });

    it('draws closed singing/jumping eyes with double lashes and glint off', () => {
      const ctx = mockContext();
      drawBallerinaFaceAndTiara(ctx, { enhanced: true, lift: 0.3, clock: 2.5 }, 0, -100);
      expect(ctx.calls.some((c) => c[0] === 'stroke')).toBe(true);
    });
  });

  describe('drawSamuraiFeatures', () => {
    it('draws glowing slit eyes, crest glint, and sash ribbons', () => {
      const ctx = mockContext();
      drawSamuraiFeatures(ctx, { enhanced: true, clock: 0.3, streak: 2 }, dummyFrame);
      expect(ctx.calls.some((c) => c[0] === 'ellipse')).toBe(true);
      expect(ctx.calls.some((c) => c[0] === 'quadraticCurveTo')).toBe(true);
    });

    it('draws warrior eye flare trails on streak >= 6 and tests low glint clock', () => {
      const ctx = mockContext();
      drawSamuraiFeatures(ctx, { enhanced: true, streak: 8, clock: 2.5 }, dummyFrame);
      expect(ctx.calls.some((c) => c[0] === 'lineTo')).toBe(true);
    });
  });

  describe('drawPumpkinFeatures', () => {
    it('draws glowing candle ember inside eyes and mouth', () => {
      const ctx = mockContext();
      drawPumpkinFeatures(ctx, { enhanced: true, streak: 0 }, dummyFrame);
      expect(ctx.calls.some((c) => c[0] === 'fill')).toBe(true);
    });

    it('draws floating spark particle from stem on streak >= 4', () => {
      const ctx = mockContext();
      drawPumpkinFeatures(ctx, { enhanced: true, streak: 5, clock: 1.2 }, dummyFrame);
      expect(ctx.calls.filter((c) => c[0] === 'arc').length).toBe(1);
    });
  });

  describe('drawScarecrowFeatures', () => {
    it('draws stitched cross eyes, stitched smile, and crow feather', () => {
      const ctx = mockContext();
      drawScarecrowFeatures(ctx, { enhanced: true }, dummyFrame);
      expect(ctx.calls.some((c) => c[0] === 'stroke')).toBe(true);
      expect(ctx.calls.some((c) => c[0] === 'fill')).toBe(true);
    });
  });

  describe('drawOctopusFeatures', () => {
    it('draws swaying outer tentacle tips', () => {
      const ctx = mockContext();
      drawOctopusFeatures(ctx, { enhanced: true, clock: 0.4 }, dummyFrame);
      expect(ctx.calls.some((c) => c[0] === 'quadraticCurveTo')).toBe(true);
      expect(ctx.calls.some((c) => c[0] === 'stroke')).toBe(true);
    });

    it('draws gold trim glint on streak >= 4', () => {
      const ctx = mockContext();
      drawOctopusFeatures(ctx, { enhanced: true, streak: 5, clock: 0.2 }, dummyFrame);
      expect(ctx.calls.some((c) => c[0] === 'arc')).toBe(true);
      expect(ctx.calls.some((c) => c[0] === 'fill')).toBe(true);
    });
  });

  describe('drawEnhancedFigure', () => {
    it('does nothing when not enhanced', () => {
      const ctx = mockContext();
      drawEnhancedFigure(ctx, { enhanced: false }, dummySpec, 'bun');
      expect(ctx.calls.length).toBe(0);
    });

    it('dispatches to ballerina when character is ballerina', () => {
      const ctx = mockContext();
      drawEnhancedFigure(ctx, { enhanced: true }, dummySpec, 'ballerina');
      expect(ctx.calls.some((c) => c[0] === 'fill')).toBe(true);
    });

    it('dispatches to bun when character is bun', () => {
      const ctx = mockContext();
      drawEnhancedFigure(ctx, { enhanced: true }, dummySpec, 'bun');
      expect(ctx.calls.some((c) => c[0] === 'fill')).toBe(true);
    });
  });

  describe('drawEnhancedCostume', () => {
    it('does nothing when not enhanced or unknown costume', () => {
      const ctx = mockContext();
      drawEnhancedCostume(ctx, { enhanced: false }, dummyFrame, 'pumpkin');
      drawEnhancedCostume(ctx, { enhanced: true }, dummyFrame, 'unknown');
      expect(ctx.calls.length).toBe(0);
    });

    it('dispatches to pumpkin, samurai, scarecrow, and octopus', () => {
      const pCtx = mockContext();
      drawEnhancedCostume(pCtx, { enhanced: true }, dummyFrame, 'pumpkin');
      expect(pCtx.calls.some((c) => c[0] === 'fill')).toBe(true);

      const sCtx = mockContext();
      drawEnhancedCostume(sCtx, { enhanced: true }, dummyFrame, 'samurai');
      expect(sCtx.calls.some((c) => c[0] === 'fill')).toBe(true);

      const cCtx = mockContext();
      drawEnhancedCostume(cCtx, { enhanced: true }, dummyFrame, 'scarecrow');
      expect(cCtx.calls.some((c) => c[0] === 'fill')).toBe(true);

      const oCtx = mockContext();
      drawEnhancedCostume(oCtx, { enhanced: true, clock: 0.3 }, dummyFrame, 'octopus');
      expect(oCtx.calls.some((c) => c[0] === 'stroke')).toBe(true);
    });
  });
});
