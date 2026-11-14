import { describe, expect, it } from 'vitest';
import { CHARACTERS, LEVELS } from '../src/config.js';
import {
  characterChoices,
  characterHits,
  exitHit,
  hitAt,
  levelHits,
  menuChoices,
  menuHits,
  menuZoom,
  pageFromScreen,
  pointInHit,
  titleAnchor,
} from '../src/core/menu.js';

describe('menu layout', () => {
  it('lists infinity, levels, and characters with hit boxes', () => {
    expect(menuChoices().map((choice) => choice.id)).toEqual([
      'infinity',
      'levels',
      'characters',
    ]);
    const desk = menuHits(false);
    const phone = menuHits(true);
    expect(desk).toHaveLength(3);
    expect(phone[0].y).toBeLessThan(desk[0].y);
    expect(pointInHit(desk[0], desk[0].x + 1, desk[0].y + 1)).toBe(true);
    expect(hitAt(desk, desk[1].x + 10, desk[1].y + 10)?.id).toBe('levels');
    expect(hitAt(desk, desk[2].x + 10, desk[2].y + 10)?.id).toBe('characters');
    expect(hitAt(desk, Number.NaN, 0)).toBeNull();
    expect(hitAt(desk, -40, -40)).toBeNull();
    expect(pointInHit(null, 0, 0)).toBe(false);
  });

  it('lays out ten levels plus back', () => {
    expect(LEVELS).toHaveLength(10);
    expect(LEVELS[0].goal).toBe(10);
    expect(LEVELS[9].goal).toBe(100);
    const desk = levelHits(false);
    const phone = levelHits(true);
    expect(desk).toHaveLength(11);
    expect(desk.at(-1).id).toBe('back');
    expect(phone.filter((hit) => hit.level)).toHaveLength(10);
    expect(titleAnchor(true)).toEqual({ x: 500, y: 100 });
    expect(menuZoom(false)).toBeCloseTo(1.28);
    expect(menuZoom(true)).toBeCloseTo(1.06);
    const back = desk.at(-1);
    expect(back.y + back.h).toBeLessThan(560);
    const modes = menuHits(false);
    expect(modes[0].w).toBeGreaterThan(modes[0].h * 0.9);
    expect(modes[0].x).toBeLessThan(modes[1].x);
    expect(modes[1].x).toBeLessThan(modes[2].x);
    expect(desk[0].h).toBeGreaterThan(50);
    const page = pageFromScreen(100, 200, { ox: 10, oy: 20, s: 2 }, { x: 480, y: 250 }, 2);
    expect(page.x).toBeCloseTo((100 - 10) / 2 / 2 - 960 / 4 + 480);
    expect(page.y).toBeCloseTo((200 - 20) / 2 / 2 - 640 / 4 + 250);
    expect(exitHit(false).id).toBe('back');
    expect(exitHit(true).label).toBe('back');
  });

  it('lays out bun and ballerina plus back', () => {
    expect(characterChoices().map((choice) => choice.id)).toEqual(
      CHARACTERS.map((choice) => choice.id),
    );
    const desk = characterHits(false);
    const phone = characterHits(true);
    expect(desk).toHaveLength(3);
    expect(desk[0].id).toBe('bun');
    expect(desk[1].id).toBe('ballerina');
    expect(desk.at(-1).id).toBe('back');
    expect(phone[0].y).toBeLessThan(desk[0].y);
    expect(phone.at(-1).y + phone.at(-1).h).toBeLessThan(560);
  });
});
