import { describe, expect, it } from 'vitest';
import {
  drawFocusLines,
  drawImpactShockwave,
  drawMangaAura,
  drawMangaCrash,
  drawMangaEmotes,
  drawMangaSfx,
  selectSfx,
} from '../src/render/manga.js';
import { mockContext } from './helpers/mockContext.js';

describe('manga effects', () => {
  describe('selectSfx', () => {
    it('selects FEVER for streaks >= 15', () => {
      expect(selectSfx(10, 15, 'normal').text).toBe('FEVER!!');
    });

    it('selects PERFECT for streaks >= 8', () => {
      expect(selectSfx(10, 8, 'normal').text).toBe('PERFECT!');
    });

    it('selects NICE for streaks >= 4', () => {
      expect(selectSfx(10, 4, 'normal').text).toBe('NICE!');
    });

    it('selects SWOOSH for snap mood when streak is low', () => {
      expect(selectSfx(1, 0, 'snap').text).toBe('SWOOSH!');
    });

    it('selects CLEAN for hurry mood when streak is low', () => {
      expect(selectSfx(1, 0, 'hurry').text).toBe('CLEAN!');
    });

    it('alternates between HOP and SWOOSH based on score parity for normal rhythm', () => {
      expect(selectSfx(2, 0, 'normal').text).toBe('HOP!');
      expect(selectSfx(3, 0, 'normal').text).toBe('SWOOSH!');
    });
  });

  describe('drawMangaSfx', () => {
    it('does nothing if not enhanced or no fleck or not playing', () => {
      const ctx = mockContext();
      drawMangaSfx(ctx, { enhanced: false, fleck: 1, phase: 'playing' });
      drawMangaSfx(ctx, { enhanced: true, fleck: 0, phase: 'playing' });
      drawMangaSfx(ctx, { enhanced: true, fleck: 1, phase: 'idle' });
      expect(ctx.calls.length).toBe(0);
    });

    it('draws burst bubble and comic sound text for even and odd scores', () => {
      const ctxEven = mockContext();
      drawMangaSfx(ctxEven, {
        enhanced: true,
        fleck: 0.8,
        phase: 'playing',
        score: 4,
        streak: 4,
        lift: 0.5,
        mood: 'normal',
      });
      expect(ctxEven.calls.some((c) => c[0] === 'fillText' && c[1] === 'NICE!')).toBe(true);
      expect(ctxEven.calls.some((c) => c[0] === 'fillText' && c[1] === 'ナイス!')).toBe(true);

      const ctxOdd = mockContext();
      drawMangaSfx(ctxOdd, {
        enhanced: true,
        fleck: 0.5,
        phase: 'playing',
        score: 5,
        streak: 0,
        lift: 0.2,
        mood: 'normal',
      });
      expect(ctxOdd.calls.some((c) => c[0] === 'fillText' && c[1] === 'SWOOSH!')).toBe(true);
    });
  });

  describe('drawFocusLines', () => {
    it('does nothing if not enhanced, not playing, or streak < 6', () => {
      const ctx = mockContext();
      drawFocusLines(ctx, 1000, 600, { enhanced: false, phase: 'playing', streak: 10 });
      drawFocusLines(ctx, 1000, 600, { enhanced: true, phase: 'idle', streak: 10 });
      drawFocusLines(ctx, 1000, 600, { enhanced: true, phase: 'playing', streak: 5 });
      expect(ctx.calls.length).toBe(0);
    });

    it('draws dynamic radial focus lines when streak is high', () => {
      const ctx = mockContext();
      drawFocusLines(ctx, 1000, 600, {
        enhanced: true,
        phase: 'playing',
        streak: 9,
        lift: 0.4,
        clock: 1.5,
      });
      expect(ctx.calls.filter((c) => c[0] === 'lineTo').length).toBe(28);
      expect(ctx.calls.some((c) => c[0] === 'stroke')).toBe(true);
    });
  });

  describe('drawImpactShockwave', () => {
    it('does nothing if not enhanced or no landDust', () => {
      const ctx = mockContext();
      drawImpactShockwave(ctx, { enhanced: false, landDust: 0.5 });
      drawImpactShockwave(ctx, { enhanced: true, landDust: 0 });
      expect(ctx.calls.length).toBe(0);
    });

    it('draws shockwave ellipse and impact ticks on landing', () => {
      const ctx = mockContext();
      drawImpactShockwave(ctx, { enhanced: true, landDust: 0.6 });
      expect(ctx.calls.some((c) => c[0] === 'ellipse')).toBe(true);
      expect(ctx.calls.filter((c) => c[0] === 'lineTo').length).toBe(10);
      expect(ctx.calls.some((c) => c[0] === 'stroke')).toBe(true);
    });
  });

  describe('drawMangaEmotes', () => {
    it('does nothing if not enhanced or not playing', () => {
      const ctx = mockContext();
      drawMangaEmotes(ctx, { enhanced: false, phase: 'playing' });
      drawMangaEmotes(ctx, { enhanced: true, phase: 'idle' });
      expect(ctx.calls.length).toBe(0);
    });

    it('draws sweatdrop on hurry rhythm', () => {
      const hurryCtx = mockContext();
      drawMangaEmotes(hurryCtx, {
        enhanced: true,
        phase: 'playing',
        lift: 0,
        mood: 'hurry',
        streak: 0,
      });
      expect(hurryCtx.calls.some((c) => c[0] === 'quadraticCurveTo')).toBe(true);
    });

    it('draws popping vein mark on snap rhythm', () => {
      const snapCtx = mockContext();
      drawMangaEmotes(snapCtx, {
        enhanced: true,
        phase: 'playing',
        lift: 0,
        mood: 'snap',
        streak: 0,
      });
      expect(snapCtx.calls.filter((c) => c[0] === 'arc').length).toBe(4);
    });

    it('draws sparkle stars on high streak', () => {
      const ctx = mockContext();
      drawMangaEmotes(ctx, {
        enhanced: true,
        phase: 'playing',
        lift: 0.3,
        mood: 'normal',
        streak: 10,
        clock: 0.8,
      });
      expect(ctx.calls.filter((c) => c[0] === 'quadraticCurveTo').length).toBe(8);
      expect(ctx.calls.some((c) => c[0] === 'fill')).toBe(true);
    });
  });

  describe('drawMangaAura', () => {
    it('does nothing if not enhanced, not playing, or streak < 10', () => {
      const ctx = mockContext();
      drawMangaAura(ctx, { enhanced: false, phase: 'playing', streak: 12 });
      drawMangaAura(ctx, { enhanced: true, phase: 'idle', streak: 12 });
      drawMangaAura(ctx, { enhanced: true, phase: 'playing', streak: 9 });
      expect(ctx.calls.length).toBe(0);
    });

    it('draws golden and cinnabar anime aura flame wisps on streak >= 10', () => {
      const ctx = mockContext();
      drawMangaAura(ctx, {
        enhanced: true,
        phase: 'playing',
        streak: 14,
        lift: 0.4,
        clock: 2,
      });
      expect(ctx.calls.filter((c) => c[0] === 'arc').length).toBe(7);
      expect(ctx.calls.filter((c) => c[0] === 'fill').length).toBe(7);

      const ctxNoClock = mockContext();
      drawMangaAura(ctxNoClock, {
        enhanced: true,
        phase: 'playing',
        streak: 10,
        lift: 0,
      });
      expect(ctxNoClock.calls.filter((c) => c[0] === 'arc').length).toBe(7);
    });
  });

  describe('drawMangaCrash', () => {
    it('does nothing if not enhanced, no blot, cleared, or won', () => {
      const ctx = mockContext();
      drawMangaCrash(ctx, { enhanced: false, blot: 0.2 });
      drawMangaCrash(ctx, { enhanced: true, blot: 0 });
      drawMangaCrash(ctx, { enhanced: true, blot: 0.2, phase: 'cleared' });
      drawMangaCrash(ctx, { enhanced: true, blot: 0.2, won: true });
      expect(ctx.calls.length).toBe(0);
    });

    it('draws jagged crash burst and sound text on blot splash', () => {
      const ctx = mockContext();
      drawMangaCrash(ctx, {
        enhanced: true,
        blot: 0.3,
        phase: 'over',
        lift: 0,
      });
      expect(ctx.calls.some((c) => c[0] === 'fillText' && c[1] === 'CRASH!!')).toBe(true);
      expect(ctx.calls.some((c) => c[0] === 'fillText' && c[1] === 'ドカンッ!!')).toBe(true);
      expect(ctx.calls.some((c) => c[0] === 'stroke')).toBe(true);
    });
  });
});
