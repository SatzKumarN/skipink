import { afterEach, describe, expect, it, vi } from 'vitest';
import { STORAGE_KEY } from '../src/config.js';
import { createState } from '../src/core/game.js';
import { prefersReducedMotion, startGame } from '../src/runtime.js';
import { mockContext } from './helpers/mockContext.js';

afterEach(() => {
  document.body.innerHTML = '';
  delete window.AudioContext;
  delete window.webkitAudioContext;
});

function harness(overrides = {}) {
  const button = document.createElement('button');
  document.body.append(button);
  const canvas = { width: 0, height: 0, style: {}, getContext: () => mockContext() };
  const mem = new Map();
  const storage = {
    getItem: (key) => (mem.has(key) ? mem.get(key) : null),
    setItem: (key, value) => mem.set(key, String(value)),
  };
  const queued = [];
  const audio = { play: vi.fn(), hum: vi.fn() };
  const paint = vi.fn();
  window.innerWidth = 900;
  window.innerHeight = 700;
  window.matchMedia = () => ({ matches: false });
  const env = {
    canvas,
    button,
    window,
    storage,
    now: () => 1000,
    raf: (fn) => {
      queued.push(fn);
      return queued.length;
    },
    audio,
    paint,
    ...overrides,
  };
  return { env, queued, audio, paint, storage, mem, button, canvas };
}

describe('prefersReducedMotion', () => {
  it('reads an explicit flag, a media query, or nothing', () => {
    expect(prefersReducedMotion({ reducedMotion: true, window })).toBe(true);
    expect(prefersReducedMotion({ reducedMotion: false, window })).toBe(false);
    expect(prefersReducedMotion({ window: { matchMedia: () => ({ matches: true }) } })).toBe(true);
    expect(prefersReducedMotion({ window: {} })).toBe(false);
    expect(prefersReducedMotion({
      window: { matchMedia: () => { throw new Error('no media'); } },
    })).toBe(false);
  });
});

describe('startGame', () => {
  it('draws the title and jumps from the button', () => {
    const { env, queued, paint, button } = harness();
    const game = startGame(env);
    queued.shift()(1000);
    expect(paint).toHaveBeenCalled();
    expect(button.textContent).toBe('Start');
    expect(button.disabled).toBe(false);
    expect(game.getState().phase).toBe('ready');
    button.dispatchEvent(new PointerEvent('pointerdown', { button: 0, cancelable: true }));
    queued.shift()(1032);
    expect(game.getState().phase).toBe('count');
    expect(button.textContent).toBe('3');
    expect(button.disabled).toBe(true);
    game.stop();
    const pending = queued.at(-1);
    pending(1100);
    expect(game.getState().time).toBeLessThan(0.05);
  });

  it('counts 3, 2, 1 before the rope starts', () => {
    const { env, queued, button } = harness();
    const game = startGame(env);
    let now = 1000;
    queued.shift()(now);
    button.dispatchEvent(new PointerEvent('pointerdown', { button: 0, cancelable: true }));
    const seen = [];
    while (game.getState().phase !== 'playing') {
      now += 50;
      queued.shift()(now);
      if (button.textContent !== seen.at(-1)) seen.push(button.textContent);
    }
    expect(seen).toEqual(['3', '2', '1', 'Jump']);
    expect(game.getState().score).toBe(0);
    expect(button.disabled).toBe(false);
    game.stop();
  });

  it('uses the real frame, page painter, and silent synth when none are injected', () => {
    const box = harness();
    delete box.env.update;
    delete box.env.paint;
    delete box.env.audio;
    window.AudioContext = undefined;
    window.webkitAudioContext = undefined;
    const game = startGame(box.env);
    box.queued.shift()(1000);
    expect(box.button.textContent).toBe('Start');
    game.stop();
  });

  it('plays cues, hums while the rope turns, and saves a new best', () => {
    const box = harness();
    box.env.update = () => ({
      state: {
        ...createState(0),
        phase: 'playing',
        time: 0.4,
        prevContact: 0,
        nextContact: 1,
        mood: 'even',
        score: 4,
        best: 4,
      },
      events: ['jump', 'start', 'skip', 'miss', 'extra'],
    });
    const game = startGame(box.env);
    box.queued.shift()(1000);
    expect(box.audio.play.mock.calls.map((call) => call[0])).toEqual(['jump', 'jump', 'land', 'blot']);
    expect(box.audio.hum).toHaveBeenCalledWith(expect.any(Number));
    expect(box.audio.hum.mock.calls.at(-1)[0]).toBeGreaterThan(0);
    expect(box.mem.get(STORAGE_KEY)).toBe('4');
    expect(box.paint.mock.calls[0][3].label).toBe('Jump');
    game.stop();
  });

  it('holds the sheet still and opens the blot immediately when motion is reduced', () => {
    const box = harness({ reducedMotion: true });
    box.env.update = () => ({
      state: {
        ...createState(),
        phase: 'over',
        time: 1.02,
        overAt: 1,
        prevContact: 0,
        nextContact: 1,
        mood: 'hang',
        score: 0,
        best: 0,
      },
      events: [],
    });
    const game = startGame(box.env);
    box.queued.shift()(2000);
    expect(box.audio.hum).toHaveBeenCalledWith(0);
    expect(box.paint.mock.calls[0][3].blot).toBe(1);
    expect(box.button.disabled).toBe(false);
    expect(box.button.textContent).toBe('Try again');
    game.stop();
  });

  it('waits out a short blot and does not write an unchanged best', () => {
    const box = harness();
    box.mem.set(STORAGE_KEY, '6');
    box.env.update = () => ({
      state: {
        ...createState(6),
        phase: 'over',
        time: 1.05,
        overAt: 1,
        prevContact: 0,
        nextContact: 1,
        mood: 'snap',
      },
      events: [],
    });
    const game = startGame(box.env);
    box.queued.shift()(1000);
    expect(box.button.disabled).toBe(true);
    expect(box.button.textContent).toBe('Wait');
    expect(box.mem.get(STORAGE_KEY)).toBe('6');
    game.stop();
  });

  it('stops scheduling when the frame itself ends the loop', () => {
    const box = harness();
    let game;
    box.env.update = (state) => {
      game.stop();
      return { state, events: [] };
    };
    game = startGame(box.env);
    box.queued.shift()(1000);
    expect(box.queued).toHaveLength(0);
  });

  it('creates and resumes audio inside the tap or key, not the first frame', () => {
    const box = harness();
    delete box.env.audio;
    let constructed = 0;
    let resumes = 0;
    window.AudioContext = class {
      constructor() {
        constructed += 1;
        this.state = 'suspended';
      }

      resume() {
        resumes += 1;
      }
    };
    const game = startGame(box.env);
    box.queued.shift()(1000);
    expect(constructed).toBe(0);
    expect(resumes).toBe(0);
    box.button.dispatchEvent(new PointerEvent('pointerdown', { button: 0, cancelable: true }));
    expect(constructed).toBe(1);
    expect(resumes).toBe(1);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyJ', cancelable: true }));
    expect(constructed).toBe(1);
    expect(resumes).toBe(2);
    game.stop();
  });

  it('refuses a canvas that cannot draw', () => {
    const box = harness();
    box.canvas.getContext = () => null;
    expect(() => startGame(box.env)).toThrow(/sketchbook page/);
  });
});
