import { AIRTIME, BLOT_TIME, COUNTDOWN, DRESSES } from '../config.js';
import { clamp01 } from './math.js';
import { exitHit, levelHits, menuHits } from './menu.js';
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
  if ((state.phase !== 'over' && state.phase !== 'cleared') || state.overAt == null) return 0;
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
  if (phase === 'menu' || phase === 'levels') return 'Choose';
  if (phase === 'count') return count ? String(count) : '';
  if (phase === 'cleared' && blot < 1) return 'Wait';
  if (phase === 'cleared') return 'Levels';
  if (phase === 'over' && blot < 1) return 'Wait';
  if (phase === 'over') return 'Try again';
  return 'Jump';
}

const ZOOM_TIME = 0.7;

export function sheetAmount(state, reducedMotion) {
  if (state.phase === 'menu' || state.phase === 'levels' || state.phase === 'ready') return 1;
  if (state.phase === 'count') return 0;
  if (state.phase === 'playing') {
    return reducedMotion ? 0 : 1 - clamp01(state.time / ZOOM_TIME);
  }
  if (state.phase === 'over' || state.phase === 'cleared') {
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
  if (state.phase === 'menu' || state.phase === 'levels') return '';
  if (state.phase === 'cleared' && blot >= 1) return 'level cleared';
  if (state.phase === 'playing' && state.score === 0 && state.best === 0 && !state.goal) {
    return 'jump as it swings under';
  }
  if (state.phase === 'playing' && state.score === 0 && state.goal) {
    return `${state.goal} skips to clear`;
  }
  if (state.phase === 'over' && blot >= 1) return 'tap drop to leave';
  return '';
}

function menuView(state, phone) {
  return menuHits(phone).map((hit) => ({
    ...hit,
    selected: hit.index === state.focus,
  }));
}

function levelsView(state, phone) {
  return levelHits(phone).map((hit) => {
    if (hit.id === 'back') {
      return {
        ...hit,
        selected: hit.index === state.focus,
        locked: false,
      };
    }
    return {
      ...hit,
      selected: hit.index === state.focus,
      locked: hit.level > state.unlocked,
      done: hit.level <= state.cleared,
    };
  });
}

export function viewModel(state, options = {}) {
  const clock = Number.isFinite(options.clock) ? options.clock : state.time;
  const phone = Boolean(options.phone);
  const blot = blotAmount(state, Boolean(options.reducedMotion));
  const count = countDigit(state);
  const progress = state.phase === 'playing' || state.phase === 'over' || state.phase === 'count'
    || state.phase === 'cleared'
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

  const hint = hintFor(state, blot);
  const showExit = (state.phase === 'over' || state.phase === 'cleared')
    && blot >= 1
    && sheet >= 0.98;

  return {
    phase: state.phase,
    mode: state.mode,
    level: state.level,
    goal: state.goal,
    unlocked: state.unlocked,
    focus: state.focus,
    progress: state.cleared,
    won: state.phase === 'cleared',
    score: state.score,
    best: state.best,
    showBest: state.best > 0 && state.mode !== 'level',
    crowned: Boolean(state.crowned) && state.score > 0,
    pencil: state.cycle === 0 && state.phase !== 'over' && state.phase !== 'cleared',
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
    hint,
    hintGlow: hint === 'tap drop to leave' || hint === 'level cleared'
      ? hintPulse(clock, Boolean(options.reducedMotion))
      : 1,
    sheet,
    recap,
    count,
    showScore: state.phase === 'playing' || state.phase === 'over' || state.phase === 'cleared',
    fleck,
    label: buttonLabel(state.phase, blot, count),
    waiting: ((state.phase === 'over' || state.phase === 'cleared') && blot < 1)
      || state.phase === 'count',
    menu: state.phase === 'menu' ? menuView(state, phone) : null,
    levels: state.phase === 'levels' ? levelsView(state, phone) : null,
    exit: showExit ? { ...exitHit(phone), selected: false, locked: false } : null,
  };
}
