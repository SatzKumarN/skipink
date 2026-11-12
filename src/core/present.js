import { AIRTIME, BLOT_TIME, COUNTDOWN, DRESSES } from '../config.js';
import { clamp01 } from './math.js';
import { idleAngle, ropeProgress } from './rope.js';

export function footClearance(state) {
  if (!state.jump) return 0;
  const elapsed = state.time - state.jump.start;
  if (elapsed < 0 || elapsed > AIRTIME) return 0;
  return Math.sin((elapsed / AIRTIME) * Math.PI);
}

export function figurePose(state) {
  if (state.phase === 'over') return 'stumble';
  if (state.jump) {
    const elapsed = state.time - state.jump.start;
    if (elapsed >= 0 && elapsed <= AIRTIME) return 'tuck';
  }
  if (
    state.landedAt != null &&
    state.time - state.landedAt >= 0 &&
    state.time - state.landedAt < 0.09
  ) {
    return 'land';
  }
  if (state.phase === 'playing' && ropeProgress(state).u > 0.84) return 'load';
  return 'stand';
}

export function handLift(mood, u) {
  const t = clamp01(u);
  if (mood === 'hang') {
    if (t < 0.35) return t / 0.35;
    if (t < 0.72) return 1;
    return clamp01(1 - (t - 0.72) / 0.28);
  }
  if (mood === 'snap') return 1 - t * t;
  if (mood === 'hurry') return 0.15;
  if (mood === 'ease') return -0.08;
  return 0;
}

export function blotAmount(state, reducedMotion) {
  if (state.phase !== 'over' || state.overAt == null) return 0;
  if (reducedMotion) return 1;
  return clamp01((state.time - state.overAt) / BLOT_TIME);
}

export function countDigit(state) {
  if (!state || state.phase !== 'count') return null;
  const elapsed = Number.isFinite(state.time) && state.time > 0 ? state.time : 0;
  const left = COUNTDOWN - elapsed;
  if (left <= 0) return null;
  return Math.ceil(left);
}

export function buttonLabel(phase, blot, count) {
  if (phase === 'ready') return 'Start';
  if (phase === 'count') return count ? String(count) : '';
  if (phase === 'over' && blot < 1) return 'Wait';
  if (phase === 'over') return 'Try again';
  return 'Jump';
}

const ZOOM_TIME = 0.7;

export function sheetAmount(state, reducedMotion) {
  if (state.phase === 'ready') return 1;
  if (state.phase === 'count') return 0;
  if (state.phase === 'playing') {
    return reducedMotion ? 0 : 1 - clamp01(state.time / ZOOM_TIME);
  }
  if (state.phase === 'over') {
    if (reducedMotion || state.overAt == null) return 1;
    return clamp01((state.time - state.overAt - BLOT_TIME) / ZOOM_TIME);
  }
  return 0;
}

export function hintPulse(clock, reducedMotion) {
  if (reducedMotion) return 1;
  const t = Number.isFinite(clock) ? clock : 0;
  return Math.sin(t * Math.PI * 2) > 0 ? 1 : 0.2;
}

export function hintFor(state, blot) {
  if (state.phase === 'ready') return 'tap to start';
  if (state.phase === 'playing' && state.score === 0 && state.best === 0) {
    return 'jump as it swings under';
  }
  if (state.phase === 'over' && blot >= 1) return 'tap to start';
  return '';
}

export function viewModel(state, options = {}) {
  const clock = Number.isFinite(options.clock) ? options.clock : state.time;
  const blot = blotAmount(state, Boolean(options.reducedMotion));
  const count = countDigit(state);
  const progress = state.phase === 'playing' || state.phase === 'over' || state.phase === 'count'
    ? ropeProgress(state)
    : { u: ((clock % 2.2) + 2.2) % 2.2 / 2.2, mood: 'even', angle: idleAngle(clock) };

  const fleck = state.skippedAt != null && state.phase === 'playing'
    ? clamp01(1 - (state.time - state.skippedAt) / 0.12)
    : 0;
  const sheet = sheetAmount(state, Boolean(options.reducedMotion));
  const recap = state.phase === 'playing' && state.recap && sheet > 0
    ? {
      score: state.recap.score,
      best: state.recap.best,
      crowned: Boolean(state.recap.crowned),
    }
    : null;

  return {
    phase: state.phase,
    score: state.score,
    best: state.best,
    showBest: state.best > 0,
    crowned: Boolean(state.crowned) && state.score > 0,
    pencil: state.cycle === 0 && state.phase !== 'over',
    dress: DRESSES[(Number.isFinite(state.dress) ? Math.abs(Math.floor(state.dress)) : 0) % DRESSES.length],
    pose: figurePose(state),
    lift: footClearance(state),
    blot,
    splash: Number.isFinite(state.splash) ? state.splash : 0,
    angle: progress.angle,
    mood: progress.mood,
    u: progress.u,
    handLift: handLift(progress.mood, progress.u),
    spread: blot,
    hint: hintFor(state, blot),
    hintGlow: hintFor(state, blot) === 'tap to start'
      ? hintPulse(clock, Boolean(options.reducedMotion))
      : 1,
    sheet,
    recap,
    count,
    showScore: state.phase === 'playing' || state.phase === 'over',
    fleck,
    label: buttonLabel(state.phase, blot, count),
    waiting: (state.phase === 'over' && blot < 1) || state.phase === 'count',
  };
}
