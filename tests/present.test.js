import { describe, expect, it } from 'vitest';
import { AIRTIME, BLOT_TIME, DRESSES } from '../src/config.js';
import { createState, press, step } from '../src/core/game.js';
import { MAX_FRAME } from '../src/config.js';
import {
  blotAmount,
  buttonLabel,
  figurePose,
  footClearance,
  handLift,
  hintFor,
  hintPulse,
  sheetAmount,
  viewModel,
} from '../src/core/present.js';

function at(time) {
  let state = press(createState()).state;
  while (state.time < time) state = step(state, Math.min(MAX_FRAME, time - state.time)).state;
  return state;
}

describe('body', () => {
  it('rises only during the hop and chooses a pose from the rope', () => {
    const playing = at(0.2);
    expect(footClearance(playing)).toBe(0);
    expect(footClearance({ ...playing, jump: { start: playing.time + 1 } })).toBe(0);
    const hop = { ...playing, jump: { start: playing.time - AIRTIME / 2 } };
    expect(footClearance(hop)).toBeCloseTo(1);
    expect(footClearance({ ...playing, jump: { start: playing.time - AIRTIME - 0.01 } })).toBe(0);
    expect(figurePose({ ...playing, phase: 'over' })).toBe('stumble');
    expect(figurePose(hop)).toBe('tuck');
    expect(figurePose({ ...playing, jump: { start: playing.time + 0.2 } })).toBe('stand');
    expect(figurePose({ ...playing, jump: { start: playing.time - AIRTIME - 0.01 } })).toBe('stand');
    expect(figurePose({ ...playing, landedAt: playing.time - 0.02 })).toBe('land');
    expect(figurePose({ ...playing, landedAt: playing.time + 0.05 })).toBe('stand');
    expect(figurePose({ ...playing, landedAt: playing.time - 0.2 })).toBe('stand');
    const late = { ...playing, time: playing.nextContact - 0.01, prevContact: 0 };
    expect(figurePose(late)).toBe('load');
    expect(figurePose(createState())).toBe('stand');
  });
});

describe('hands and blot', () => {
  it('lifts on a hang and a snap, and blooms the blot after a miss', () => {
    expect(handLift('hang', -1)).toBe(0);
    expect(handLift('hang', 0.2)).toBeCloseTo(0.2 / 0.35);
    expect(handLift('hang', 0.5)).toBe(1);
    expect(handLift('hang', 0.8)).toBeLessThan(1);
    expect(handLift('hang', 1)).toBe(0);
    expect(handLift('hang', 3)).toBe(0);
    expect(handLift('snap', 0)).toBe(1);
    expect(handLift('snap', 1)).toBe(0);
    expect(handLift('hurry', 0)).toBe(0.15);
    expect(handLift('ease', 0)).toBe(-0.08);
    expect(handLift('even', 0.4)).toBe(0);
    expect(handLift('other', 0.4)).toBe(0);

    const over = { ...at(0.2), phase: 'over', overAt: 1, time: 1.35 };
    expect(blotAmount(over, false)).toBeCloseTo(0.35 / BLOT_TIME);
    expect(blotAmount(over, true)).toBe(1);
    expect(blotAmount({ ...over, time: 0 }, false)).toBe(0);
    expect(blotAmount({ ...over, overAt: null }, true)).toBe(0);
    expect(blotAmount(createState(), true)).toBe(0);
  });
});

describe('copy', () => {
  it('names the button and the pencil note for each phase', () => {
    expect(buttonLabel('ready', 0)).toBe('Start');
    expect(buttonLabel('over', 0.2)).toBe('Wait');
    expect(buttonLabel('over', 1)).toBe('Try again');
    expect(buttonLabel('playing', 0)).toBe('Jump');
    expect(buttonLabel('other', 0)).toBe('Jump');
    const ready = createState();
    const playing = at(0.1);
    expect(hintFor(ready, 0)).toBe('tap to start');
    expect(hintFor(playing, 0)).toBe('watch the rope');
    expect(hintFor({ ...playing, score: 2 }, 0)).toBe('');
    expect(hintFor({ ...playing, phase: 'over' }, 1)).toBe('tap to start');
    expect(hintFor({ ...playing, phase: 'over' }, 0.2)).toBe('');
    expect(hintPulse(0.25, false)).toBe(1);
    expect(hintPulse(0, false)).toBe(0.2);
    expect(hintPulse(Number.NaN, false)).toBe(0.2);
    expect(hintPulse(0.75, true)).toBe(1);
  });
});

describe('viewModel', () => {
  it('builds the ready page, a live skip, and a finished sheet', () => {
    const ready = viewModel(createState());
    expect(ready.hint).toBe('tap to start');
    expect(ready.sheet).toBe(1);
    expect(ready.hintGlow).toBe(0.2);
    expect(viewModel(createState(), { clock: 0.25, reducedMotion: true }).hintGlow).toBe(1);
    expect(ready.showScore).toBe(false);
    expect(ready.dress).toEqual(DRESSES[0]);
    expect(ready.splash).toBe(0);
    expect(viewModel({ ...createState(), splash: 0.4 }).splash).toBe(0.4);
    expect(viewModel({ ...createState(), splash: Number.NaN }).splash).toBe(0);
    expect(viewModel({ ...createState(), dress: 1 }).dress).toEqual(DRESSES[1]);
    expect(viewModel({ ...createState(), dress: -1 }).dress).toEqual(DRESSES[1]);
    expect(viewModel({ ...createState(), dress: Number.NaN }).dress).toEqual(DRESSES[0]);
    expect(ready.pencil).toBe(true);
    expect(ready.label).toBe('Start');
    const quiet = viewModel(createState(), { clock: Number.NaN });
    expect(quiet.angle).toBeGreaterThan(0);

    let state = at(0.2);
    state = { ...state, skippedAt: state.time - 0.02, best: 4 };
    const live = viewModel(state, { clock: 3 });
    expect(live.pose).toBe('stand');
    expect(live.sheet).toBeLessThan(1);
    expect(viewModel(state, { reducedMotion: true }).sheet).toBe(0);
    expect(sheetAmount({ phase: 'playing', time: 0 }, false)).toBe(1);
    expect(sheetAmount({ phase: 'over', overAt: null, time: 2 }, false)).toBe(1);
    expect(sheetAmount({ phase: 'other' }, false)).toBe(0);
    expect(live.fleck).toBeGreaterThan(0);
    expect(live.showBest).toBe(true);
    expect(live.pencil).toBe(true);
    expect(viewModel({ ...state, cycle: 1 }).pencil).toBe(false);
    expect(viewModel({ ...state, skippedAt: state.time - 1 }).fleck).toBe(0);
    expect(viewModel({ ...state, skippedAt: null }).fleck).toBe(0);

    const done = viewModel(
      {
        ...state,
        phase: 'over',
        overAt: state.time,
        time: state.time + BLOT_TIME,
        score: 3,
        best: 1,
        crowned: true,
        skippedAt: state.time,
      },
      { reducedMotion: false },
    );
    expect(done.pose).toBe('stumble');
    expect(done.pencil).toBe(false);
    expect(done.blot).toBe(1);
    expect(done.waiting).toBe(false);
    expect(done.crowned).toBe(true);
    expect(done.fleck).toBe(0);
    expect(done.hint).toBe('tap to start');
    expect(done.sheet).toBe(0);
    expect(sheetAmount({
      phase: 'over',
      overAt: state.time,
      time: state.time + BLOT_TIME + 0.7,
    }, false)).toBe(1);
    expect(done.recap).toBeNull();

    const restarted = viewModel({ ...state, score: 0, best: 4, recap: { score: 3, best: 4, crowned: true } });
    expect(restarted.recap).toEqual({ score: 3, best: 4, crowned: true });
    expect(viewModel({ ...state, recap: { score: 1, best: 1, crowned: false } }).recap.crowned).toBe(false);
    expect(viewModel({ ...state, time: 2, recap: { score: 3, best: 4 } }).recap).toBeNull();
    expect(viewModel({ ...state, recap: { score: 3, best: 4 } }, { reducedMotion: true }).recap).toBeNull();

    const freshMiss = viewModel(
      { ...state, phase: 'over', overAt: state.time, score: 0, crowned: true },
      { reducedMotion: true },
    );
    expect(freshMiss.blot).toBe(1);
    expect(freshMiss.crowned).toBe(false);
    expect(freshMiss.waiting).toBe(false);
    expect(viewModel({ ...createState(), phase: 'mystery' }).pose).toBe('stand');
  });
});
