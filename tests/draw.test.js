import { describe, expect, it } from 'vitest';
import { COLOR, DRESSES } from '../src/config.js';
import { BOTTOM, TOP } from '../src/core/rope.js';
import { drawScene } from '../src/render/draw.js';
import { mockContext, styleWas } from './helpers/mockContext.js';

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
    expect(ctx.calls.some((call) => call[0] === 'fillText' && call[1] === 'ink')).toBe(true);
    expect(ctx.calls.some((call) => call[0] === 'fillText' && call[1] === 'skip')).toBe(true);
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
    expect(styleWas(ctx, 'fillStyle', DRESSES[1].skirt)).toBe(true);
    expect(styleWas(ctx, 'fillStyle', DRESSES[1].deep)).toBe(true);
    drawScene(mockContext(), 800, 600, scene({
      blot: 0.35,
      splash: 0,
      pose: 'stumble',
      fleck: 0,
      pencil: false,
      dress: DRESSES[3],
    }));
    expect(ctx.calls.some((call) => call[0] === 'fillText' && call[1] === 'new')).toBe(false);
    expect(ctx.calls.filter((call) => call[0] === 'ellipse').length).toBeGreaterThan(30);
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
});
