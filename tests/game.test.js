import { describe, expect, it } from 'vitest';
import { AIRTIME, BLOT_TIME, COUNTDOWN, GRACE, MAX_FRAME, OPENING_SLACK } from '../src/config.js';
import { DRESSES } from '../src/config.js';
import { createState, feetUp, frame, press, step } from '../src/core/game.js';
import { buildSentence } from '../src/core/sentence.js';

function seek(state, time) {
  let current = state;
  const events = [];
  while (current.time < time - 1e-9 && (current.phase === 'playing' || current.phase === 'count')) {
    const dt = Math.min(MAX_FRAME, time - current.time);
    const result = step(current, dt);
    current = result.state;
    events.push(...result.events);
    if (result.events.includes('miss')) break;
  }
  return { state: current, events };
}

function clearSkips(count, best = 0) {
  let state = press(createState(best)).state;
  for (let i = 0; i < count; i += 1) {
    const contact = state.nextContact;
    const moved = seek(state, contact - 0.1);
    expect(moved.state.phase).toBe('playing');
    state = press(moved.state).state;
    const landed = seek(state, contact + 0.001);
    expect(landed.events).toContain('skip');
    state = landed.state;
  }
  return state;
}

describe('createState', () => {
  it('stores a whole best count and starts on the title', () => {
    expect(createState().phase).toBe('ready');
    expect(createState(4.8).best).toBe(4);
    expect(createState(-3).best).toBe(0);
    expect(createState(Number.NaN).best).toBe(0);
  });
});

describe('feetUp', () => {
  it('accepts a contact only while the jump still covers it', () => {
    expect(feetUp(null, 1)).toBe(false);
    const jump = { start: 1 };
    expect(feetUp(jump, 0.99)).toBe(false);
    expect(feetUp(jump, 1)).toBe(true);
    expect(feetUp(jump, 1 + AIRTIME + GRACE)).toBe(true);
    expect(feetUp(jump, 1 + AIRTIME + GRACE + 0.01)).toBe(false);
  });
});

describe('a run', () => {
  it('starts on the first press without spending a jump', () => {
    const ready = createState(2);
    const started = press(ready);
    expect(ready.phase).toBe('ready');
    expect(started.events).toEqual(['start']);
    expect(started.state.phase).toBe('count');
    expect(started.state.score).toBe(0);
    expect(started.state.best).toBe(2);
    expect(started.state.jump).toBeNull();
    expect(started.state.nextContact).toBeCloseTo(
      COUNTDOWN + started.state.sentence[0].gap + OPENING_SLACK,
    );
    expect(step(ready, 0.2).state.phase).toBe('ready');
    expect(step(ready, 0.2).events).toEqual([]);

    let state = started.state;
    while (state.time < 1) state = step(state, MAX_FRAME).state;
    expect(state.phase).toBe('count');
    while (state.time < 2) state = step(state, MAX_FRAME).state;
    expect(state.phase).toBe('count');
    expect(press(state).events).toEqual([]);
    expect(press(state).state).toBe(state);
    while (state.phase === 'count') state = step(state, MAX_FRAME).state;
    expect(state.phase).toBe('playing');
    expect(state.score).toBe(0);
    expect(state.jump).toBeNull();
    expect(state.time).toBeGreaterThanOrEqual(COUNTDOWN);
    expect(state.time).toBeLessThan(COUNTDOWN + MAX_FRAME);
  });

  it('counts a press that is in the air when the stitch arrives', () => {
    let state = press(createState()).state;
    const contact = state.nextContact;
    state = seek(state, contact - 0.1).state;
    state = press(state).state;
    const result = seek(state, contact + 0.001);
    expect(result.state.score).toBe(1);
    expect(result.state.phase).toBe('playing');
    expect(result.state.skippedAt).toBeCloseTo(contact);
    expect(result.state.mood).toBe('even');
  });

  it('accepts the earliest fair press and misses an earlier one', () => {
    const begin = press(createState()).state;
    const contact = begin.nextContact;
    const fairAt = seek(begin, contact - 0.2).state;
    const fair = seek(press(fairAt).state, contact + 0.001);
    expect(fair.state.score).toBe(1);

    const earlyAt = contact - AIRTIME - GRACE - 0.05;
    const early = seek(press(seek(begin, earlyAt).state).state, contact + 0.001);
    expect(early.state.phase).toBe('over');
    expect(early.state.score).toBe(0);
    expect(early.state.jump).toBeNull();
  });

  it('misses when the shoes are on the page', () => {
    const started = press(createState()).state;
    const state = seek(started, started.nextContact + 0.001);
    expect(state.state.phase).toBe('over');
    expect(state.events).toContain('miss');
    expect(state.state.crowned).toBe(false);
    expect(state.state.splash).toBeGreaterThanOrEqual(0);
    expect(state.state.splash).toBeLessThan(1);
    expect(step(state.state, 0.1).events).toEqual([]);
    expect(step(state.state, 0.1).state.phase).toBe('over');
  });

  it('ignores a second press in the air and allows one after landing', () => {
    let state = seek(press(createState()).state, COUNTDOWN + 0.4).state;
    state = press(state).state;
    expect(press(state).events).toEqual([]);
    expect(press(state).state).toBe(state);
    const fair = seek(state, state.jump.start + AIRTIME + 0.02);
    expect(fair.state.jump).toEqual({ start: state.jump.start });
    expect(fair.state.landedAt).toBeCloseTo(state.jump.start + AIRTIME);
    expect(press(fair.state).events).toEqual(['jump']);
    const landed = seek(state, state.jump.start + AIRTIME + GRACE + 0.02);
    expect(landed.state.jump).toBeNull();
    expect(landed.state.landedAt).toBeCloseTo(state.jump.start + AIRTIME);
    expect(press(landed.state).events).toEqual(['jump']);
  });

  it('keeps a jump fair through the grace window at 60 fps', () => {
    const dt = 1 / 60;
    const begin = press(createState()).state;
    const contact = begin.nextContact;

    function jumpEarly(early) {
      let state = seek(begin, contact - early).state;
      state = press(state).state;
      const events = [];
      while (state.time < contact + dt && state.phase === 'playing') {
        const result = step(state, dt);
        state = result.state;
        events.push(...result.events);
        if (events.includes('skip') || events.includes('miss')) break;
      }
      return { state, events };
    }

    for (const early of [0.284, 0.3, AIRTIME + GRACE]) {
      const fair = jumpEarly(early);
      expect(fair.events).toContain('skip');
      expect(fair.state.phase).toBe('playing');
      expect(fair.state.score).toBe(1);
    }

    const early = jumpEarly(AIRTIME + GRACE + 0.05);
    expect(early.events).toContain('miss');
    expect(early.state.phase).toBe('over');
    expect(early.state.score).toBe(0);
  });

  it('keeps the best and crowns a higher count', () => {
    const good = clearSkips(2, 5);
    const missed = seek(good, good.nextContact + 0.001);
    expect(missed.state.score).toBe(2);
    expect(missed.state.best).toBe(5);
    expect(missed.state.crowned).toBe(false);

    const better = seek(clearSkips(2, 0), clearSkips(2, 0).nextContact + 0.001);
    expect(better.state.best).toBe(2);
    expect(better.state.crowned).toBe(true);
  });

  it('waits for the blot, then opens a fresh sheet with the best intact', () => {
    const missed = seek(clearSkips(1, 4), clearSkips(1, 4).nextContact + 0.001).state;
    expect(press(missed).events).toEqual([]);
    const waited = step(missed, 0);
    let state = missed;
    while (state.time < state.overAt + BLOT_TIME) state = step(state, MAX_FRAME).state;
    expect(press(waited).events).toEqual([]);
    const again = press(state);
    expect(again.events).toEqual(['start']);
    expect(again.state.score).toBe(0);
    expect(again.state.best).toBe(4);
    expect(again.state.phase).toBe('count');
    expect(again.state.recap).toEqual({ score: 1, best: 4, crowned: false });
    let replay = again.state;
    while (replay.phase === 'count') replay = step(replay, MAX_FRAME).state;
    expect(replay.phase).toBe('playing');
    expect(replay.recap).toEqual({ score: 1, best: 4, crowned: false });
    expect(again.state.dress).toBe(1);
    expect(press(createState()).state.recap).toBeNull();
    expect(press(createState()).state.dress).toBe(0);
    expect(press({ ...state, dress: DRESSES.length - 1 }).state.dress).toBe(0);
    expect(press({ ...state, dress: Number.NaN }).state.dress).toBe(1);
  });

  it('rolls into the next sentence after 27 skips', () => {
    const state = clearSkips(27);
    expect(state.score).toBe(27);
    expect(state.cycle).toBe(1);
    expect(state.turn).toBe(0);
    expect(state.sentence[0].gap).toBeLessThan(buildSentence(0)[0].gap);
  });

  it('moves a hitch only a short step and ignores a press the page does not know', () => {
    const started = press(createState()).state;
    expect(step(started, 10).state.time).toBeCloseTo(MAX_FRAME);
    expect(step(started, Number.NaN).state.time).toBe(0);
    expect(step(started, -1).state.time).toBe(0);
    expect(step(started, 0).state.time).toBe(0);
    const odd = { ...started, phase: 'other' };
    expect(press(odd).state).toBe(odd);
    expect(press(odd).events).toEqual([]);
  });
});

describe('frame', () => {
  it('applies a press before the clock moves', () => {
    expect(frame(createState(), 5).events).toEqual([]);
    expect(frame(createState(), 0.02, null).events).toEqual([]);
    expect(frame(createState(), 0.02, { pressed: false }).events).toEqual([]);
    const started = frame(createState(), 5, { pressed: true });
    expect(started.events).toEqual(['start']);
    expect(started.state.time).toBeCloseTo(MAX_FRAME);
    expect(started.state.phase).toBe('count');
  });
});
