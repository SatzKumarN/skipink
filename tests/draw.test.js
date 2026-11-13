import { describe, expect, it } from 'vitest';
import { COLOR, DRESSES } from '../src/config.js';
import { BOTTOM, TOP } from '../src/core/rope.js';
import { drawScene } from '../src/render/draw.js';
import { mockContext, styleWas } from './helpers/mockContext.js';

const BRUSH = '"Caveat Brush", Georgia, serif';
const PEN = '"Kalam", Georgia, serif';

function fontFor(ctx, text) {
  const index = ctx.calls.findIndex((call) => call[0] === 'fillText' && call[1] === text);
  for (let i = index - 1; i >= 0; i -= 1) {
    if (ctx.calls[i][0] === 'set' && ctx.calls[i][1] === 'font') return ctx.calls[i][2];
  }
  return '';
}

function scene(overrides = {}) {
  return {
    phase: 'playing',
    score: 4,
    best: 2,
    showBest: true,
    crowned: true,
    pencil: true,
    pose: 'stand',
    lift: 0.6,
    blot: 0,
    angle: BOTTOM,
    mood: 'even',
    u: 0.4,
    handLift: 0.2,
    spread: 0,
    hint: 'watch the rope',
    showScore: true,
    fleck: 0.8,
    label: 'Jump',
    waiting: false,
    ...overrides,
  };
}

describe('drawScene', () => {
  it('paints the live page, the stitch, and every pose', () => {
    const ctx = mockContext();
    drawScene(ctx, 1000, 700, scene());
    expect(styleWas(ctx, 'strokeStyle', COLOR.cinnabar)).toBe(true);
    expect(styleWas(ctx, 'strokeStyle', COLOR.ink)).toBe(true);
    expect(styleWas(ctx, 'fillStyle', COLOR.skirt)).toBe(true);
    const dyed = mockContext();
    drawScene(dyed, 800, 600, scene({ dress: DRESSES[2], pose: 'stand', fleck: 0, blot: 0 }));
    expect(styleWas(dyed, 'fillStyle', DRESSES[2].skirt)).toBe(true);
    expect(styleWas(dyed, 'fillStyle', DRESSES[2].deep)).toBe(true);
    const skipAt = ctx.calls.findIndex((call) => call[0] === 'fillText' && call[1] === 'skip');
    const inkAt = ctx.calls.findIndex((call) => call[0] === 'fillText' && call[1] === 'ink');
    const fillBefore = (index) => {
      for (let i = index - 1; i >= 0; i -= 1) {
        if (ctx.calls[i][0] === 'set' && ctx.calls[i][1] === 'fillStyle') return ctx.calls[i][2];
      }
      return null;
    };
    expect(skipAt).toBeGreaterThan(-1);
    expect(inkAt).toBeGreaterThan(skipAt);
    expect(ctx.calls[inkAt][2]).toBe(ctx.calls[skipAt][2] + ctx.calls[skipAt][1].length * 10);
    expect(ctx.calls[inkAt][3]).toBe(ctx.calls[skipAt][3]);
    expect(fillBefore(skipAt)).toBe(COLOR.cinnabar);
    expect(fillBefore(inkAt)).toBe(COLOR.ink);
    expect(ctx.calls.some((call) => call[0] === 'fillText' && call[1] === '4')).toBe(true);
    expect(ctx.calls.some((call) => call[0] === 'fillText' && call[1] === 'new')).toBe(true);
    expect(ctx.calls.some((call) => call[0] === 'fillText' && call[1] === 'best 2')).toBe(true);
    expect(ctx.calls.some((call) => call[0] === 'setLineDash')).toBe(true);

    drawScene(mockContext(), 900, 640, scene({
      phase: 'over',
      sheet: 1,
      hint: 'tap to start',
      hintGlow: 0.2,
      pencil: false,
      blot: 0,
    }));
    drawScene(mockContext(), 900, 640, scene({
      phase: 'over',
      sheet: 1,
      crowned: false,
      showBest: false,
      hint: '',
      pencil: false,
      blot: 0,
    }));
    drawScene(mockContext(), 900, 640, scene({
      phase: 'over',
      sheet: 0.2,
      hint: 'watch the rope',
    }));
    drawScene(mockContext(), 390, 844, scene({
      phase: 'playing',
      sheet: 0.2,
      hint: 'watch the rope',
    }), { top: 20, right: 0, bottom: 16, left: 0 });
    drawScene(mockContext(), 390, 844, scene({
      phase: 'over',
      sheet: 1,
      hint: 'tap to start',
      hintGlow: 1,
    }));
    drawScene(mockContext(), 390, 844, scene({
      phase: 'over',
      sheet: 0.4,
      crowned: true,
      hint: 'watch the rope',
    }));
    drawScene(mockContext(), 390, 844, scene({
      phase: 'ready',
      sheet: 1,
      hint: 'tap to start',
      hintGlow: 0.2,
    }));
    const counting = mockContext();
    drawScene(counting, 900, 640, scene({
      phase: 'count',
      sheet: 1,
      score: 0,
      showScore: false,
      hint: '',
      count: 3,
    }));
    expect(counting.calls.some((call) => call[0] === 'fillText' && call[1] === '3')).toBe(true);
    const phoneCount = mockContext();
    drawScene(phoneCount, 390, 844, scene({
      phase: 'count',
      sheet: 1,
      score: 0,
      showScore: false,
      hint: '',
      count: 1,
    }));
    expect(phoneCount.calls.some((call) => call[0] === 'fillText' && call[1] === '1')).toBe(true);
    const withFigure = mockContext();
    drawScene(withFigure, 900, 640, scene({
      phase: 'count',
      sheet: 0,
      score: 0,
      showScore: false,
      hint: '',
      count: 2,
      pose: 'stand',
      pencil: true,
    }));
    expect(withFigure.calls.some((call) => call[0] === 'fillText' && call[1] === '2')).toBe(true);
    expect(styleWas(withFigure, 'fillStyle', COLOR.skirt)).toBe(true);
    drawScene(mockContext(), 900, 640, scene({
      phase: 'count',
      sheet: 1,
      hint: '',
      count: 4,
    }));

    drawScene(mockContext(), 900, 640, scene({
      phase: 'playing',
      sheet: 0.8,
      score: 0,
      recap: { score: 6, best: 4, crowned: true },
      hint: 'watch the rope',
    }));
    drawScene(mockContext(), 390, 844, scene({
      phase: 'playing',
      sheet: 0.25,
      score: 0,
      recap: { score: 6, best: 0, crowned: false },
      hint: 'watch the rope',
    }));
    drawScene(mockContext(), 390, 844, scene({
      phase: 'playing',
      sheet: 0.9,
      score: 0,
      recap: { score: 6, best: 9, crowned: true },
      hint: '',
    }));
    drawScene(mockContext(), 390, 844, scene({
      phase: 'playing',
      sheet: 0.05,
      score: 0,
      recap: { score: 6, best: 4, crowned: false },
      hint: 'watch the rope',
    }));

    drawScene(mockContext(), 900, 640, scene({
      phase: 'playing',
      sheet: 0.8,
      showBest: false,
      hint: 'watch the rope',
      pencil: false,
    }));

    ['load', 'tuck', 'land', 'stumble', 'other'].forEach((pose) => {
      drawScene(mockContext(), 800, 600, scene({
        pose,
        pencil: false,
        showScore: false,
        showBest: false,
        crowned: false,
        hint: '',
        fleck: 0,
        blot: 0,
        angle: pose === 'load' ? Math.PI : TOP,
        handLift: -0.08,
        spread: 0,
      }));
    });
  });

  it('paints a smudged sheet without the pencil guide', () => {
    const ctx = mockContext();
    drawScene(ctx, 900, 640, scene({
      pencil: false,
      fleck: 0,
      blot: 1,
      spread: 1,
      hint: 'tap for a fresh sheet',
      crowned: false,
      showScore: true,
      angle: TOP,
      pose: 'stumble',
      dress: DRESSES[1],
    }));
    expect(ctx.calls.some((call) => call[0] === 'setLineDash')).toBe(false);
    expect(styleWas(ctx, 'fillStyle', COLOR.ink)).toBe(true);
    const fading = mockContext();
    drawScene(fading, 900, 640, scene({
      blot: 0.2,
      pencil: false,
      fleck: 0,
      pose: 'stumble',
      dress: DRESSES[1],
    }));
    expect(styleWas(fading, 'fillStyle', DRESSES[1].skirt)).toBe(true);
    expect(styleWas(fading, 'fillStyle', DRESSES[1].deep)).toBe(true);
    drawScene(mockContext(), 800, 600, scene({
      blot: 0.35,
      splash: 0,
      pose: 'stumble',
      fleck: 0,
      pencil: false,
      dress: DRESSES[3],
    }));
    expect(ctx.calls.some((call) => call[0] === 'fillText' && call[1] === 'new')).toBe(false);
    expect(ctx.calls.filter((call) => call[0] === 'ellipse').length).toBeGreaterThan(16);
    expect(ctx.calls.some((call) => call[0] === 'quadraticCurveTo')).toBe(true);
    const other = mockContext();
    drawScene(other, 800, 600, scene({
      blot: 1,
      splash: 0.91,
      fleck: 0,
      pencil: false,
      pose: 'stumble',
      showScore: false,
      hint: '',
    }));
    const spot = (painted) => painted.calls.find((call) => call[0] === 'ellipse');
    expect(spot(other)[1]).not.toBe(spot(ctx)[1]);
  });

  it('sets Caveat Brush on the ink marks and Kalam on the notes', () => {
    const playing = mockContext();
    drawScene(playing, 900, 640, scene({ hint: 'jump as it swings under' }));
    expect(fontFor(playing, 'skip')).toContain(BRUSH);
    expect(fontFor(playing, 'ink')).toContain(BRUSH);
    expect(fontFor(playing, '4')).toContain(BRUSH);
    expect(fontFor(playing, 'skips')).toContain(PEN);
    expect(fontFor(playing, 'best 2')).toContain(PEN);
    expect(fontFor(playing, 'new')).toContain(PEN);
    expect(fontFor(playing, 'jump as it swings under')).toContain(PEN);

    const counting = mockContext();
    drawScene(counting, 900, 640, scene({
      phase: 'count',
      sheet: 1,
      score: 0,
      showScore: false,
      hint: '',
      count: 3,
    }));
    expect(fontFor(counting, '3')).toContain(BRUSH);
    expect(fontFor(counting, 'skip')).toContain(BRUSH);
  });

  it('bursts a miss into a black ink splash', () => {
    const ctx = mockContext();
    drawScene(ctx, 900, 640, scene({
      blot: 1,
      splash: 0.37,
      lift: 0,
      fleck: 0,
      pencil: false,
      pose: 'stumble',
      hint: '',
      showScore: false,
    }));
    const marks = ctx.calls.filter((call) => call[0] === 'ellipse');
    const xs = marks.map((call) => call[1]);
    const ys = marks.map((call) => call[2]);
    expect(marks.length).toBeGreaterThan(16);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(140);
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(100);
    expect(marks.some((call) => call[3] < 3 && call[4] < 3)).toBe(true);
    expect(ctx.calls.some((call) => call[0] === 'quadraticCurveTo')).toBe(true);
    expect(styleWas(ctx, 'fillStyle', COLOR.ink)).toBe(true);
    expect(styleWas(ctx, 'fillStyle', COLOR.paper)).toBe(true);
    const flying = mockContext();
    drawScene(flying, 900, 640, scene({
      blot: 0.12,
      splash: 0.37,
      lift: 0,
      fleck: 0,
      pencil: false,
      pose: 'stumble',
      hint: '',
      showScore: false,
    }));
    const early = flying.calls.find((call) => call[0] === 'ellipse');
    expect(early[1]).not.toBe(marks[0][1]);
  });
});
