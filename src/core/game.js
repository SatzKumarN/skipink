import {
  AIRTIME,
  BLOT_TIME,
  COUNTDOWN,
  DRESSES,
  GRACE,
  LEVELS,
  MAX_FRAME,
  OPENING_SLACK,
} from '../config.js';
import { unlockedLevel } from '../storage.js';
import { exitHit, hitAt, levelHits, menuHits } from './menu.js';
import { buildSentence } from './sentence.js';

function safeCleared(cleared) {
  if (!Number.isFinite(cleared) || cleared < 0) return 0;
  return Math.min(LEVELS.length, Math.floor(cleared));
}

export function createState(best = 0, cleared = 0) {
  const safeBest = Number.isFinite(best) && best > 0 ? Math.floor(best) : 0;
  const progress = safeCleared(cleared);
  return {
    phase: 'menu',
    mode: null,
    level: null,
    goal: null,
    cleared: progress,
    unlocked: unlockedLevel(progress),
    focus: 0,
    time: 0,
    score: 0,
    best: safeBest,
    crowned: false,
    cycle: 0,
    turn: 0,
    sentence: [],
    prevContact: 0,
    nextContact: 0,
    mood: 'even',
    jump: null,
    landedAt: null,
    skippedAt: null,
    overAt: null,
    dress: 0,
    splash: 0,
  };
}

function dressIndex(state) {
  if (state.phase !== 'over' && state.phase !== 'cleared') return 0;
  const current = Number.isFinite(state.dress) ? Math.floor(state.dress) : 0;
  return (current + 1) % DRESSES.length;
}

function keepProgress(state) {
  return {
    best: state.best,
    cleared: safeCleared(state.cleared),
    dress: state.dress,
  };
}

function openMenu(state) {
  const progress = keepProgress(state);
  return {
    state: {
      ...createState(progress.best, progress.cleared),
      dress: progress.dress,
      focus: 0,
    },
    events: [],
  };
}

function openLevels(state) {
  const progress = keepProgress(state);
  const unlocked = unlockedLevel(progress.cleared);
  const focus = Math.min(
    Number.isFinite(state.focus) ? Math.max(0, Math.floor(state.focus)) : 0,
    unlocked - 1,
  );
  return {
    state: {
      ...createState(progress.best, progress.cleared),
      phase: 'levels',
      dress: progress.dress,
      focus,
    },
    events: [],
  };
}

function startRun(state) {
  const sentence = buildSentence(0);
  const first = sentence[0];
  const progress = keepProgress(state);
  return {
    state: {
      ...createState(progress.best, progress.cleared),
      phase: 'count',
      mode: state.mode,
      level: state.level,
      goal: state.goal,
      sentence,
      prevContact: COUNTDOWN,
      nextContact: COUNTDOWN + first.gap + OPENING_SLACK,
      mood: first.mood,
      dress: dressIndex(state),
      recap: state.phase === 'over'
        ? { score: state.score, best: state.best, crowned: Boolean(state.crowned) }
        : null,
    },
    events: ['start'],
  };
}

function pickMenu(state, input = {}) {
  const hits = menuHits(Boolean(input.phone));
  const tapped = hitAt(hits, input.x, input.y);
  const index = tapped ? tapped.index : state.focus;
  const choice = hits[index] || hits[0];
  if (!choice) return { state, events: [] };
  if (choice.id === 'levels') {
    return openLevels({ ...state, focus: 0 });
  }
  return startRun({
    ...state,
    mode: 'infinity',
    level: null,
    goal: null,
  });
}

function pickLevel(state, input = {}) {
  const hits = levelHits(Boolean(input.phone));
  const tapped = hitAt(hits, input.x, input.y);
  const index = tapped ? tapped.index : state.focus;
  const choice = hits[index];
  if (!choice) return { state, events: [] };
  if (choice.id === 'back') return openMenu(state);
  if (choice.level > state.unlocked) return { state, events: [] };
  return startRun({
    ...state,
    mode: 'level',
    level: choice.level,
    goal: choice.goal,
  });
}

export function feetUp(jump, contact) {
  if (!jump) return false;
  return contact >= jump.start && contact <= jump.start + AIRTIME + GRACE;
}

export function steer(state, delta) {
  const step = Number.isFinite(delta) ? Math.sign(delta) : 0;
  if (!step) return state;
  if (state.phase === 'menu') {
    const max = 1;
    const next = ((state.focus + step) % (max + 1) + (max + 1)) % (max + 1);
    return { ...state, focus: next };
  }
  if (state.phase === 'levels') {
    const max = LEVELS.length;
    const next = ((state.focus + step) % (max + 1) + (max + 1)) % (max + 1);
    return { ...state, focus: next };
  }
  return state;
}

export function goBack(state) {
  if (state.phase === 'levels') return openMenu(state).state;
  if (state.phase === 'over' || state.phase === 'cleared') {
    if (state.overAt != null && state.time - state.overAt < BLOT_TIME) return state;
    if (state.mode === 'level') return openLevels(state).state;
    return openMenu(state).state;
  }
  if (state.phase === 'count' || state.phase === 'playing') {
    if (state.mode === 'level') return openLevels(state).state;
    return openMenu(state).state;
  }
  return state;
}

const CARD_ZOOM = 0.7;

function leaveRun(state) {
  if (state.mode === 'level') return openLevels(state);
  return openMenu(state);
}

function runCardReady(state) {
  return state.overAt != null && state.time - state.overAt >= BLOT_TIME + CARD_ZOOM;
}

function tappedExit(state, input = {}) {
  if (!runCardReady(state)) return false;
  return Boolean(hitAt([exitHit(Boolean(input.phone))], input.x, input.y));
}

export function press(state, input = {}) {
  if (state.phase === 'menu') return pickMenu(state, input);
  if (state.phase === 'levels') return pickLevel(state, input);
  if (state.phase === 'cleared') {
    if (state.overAt != null && state.time - state.overAt < BLOT_TIME) {
      return { state, events: [] };
    }
    if (tappedExit(state, input)) return openMenu(state);
    return openLevels(state);
  }
  if (state.phase === 'over') {
    if (state.time - state.overAt < BLOT_TIME) return { state, events: [] };
    if (tappedExit(state, input)) return leaveRun(state);
    return startRun(state);
  }
  if (state.phase !== 'playing') return { state, events: [] };
  if (state.jump && state.time < state.jump.start + AIRTIME) {
    return { state, events: [] };
  }
  return {
    state: { ...state, jump: { start: state.time }, landedAt: null },
    events: ['jump'],
  };
}

function advance(state, contact) {
  let cycle = state.cycle;
  let turn = state.turn + 1;
  let sentence = state.sentence;
  if (turn >= sentence.length) {
    cycle += 1;
    turn = 0;
    sentence = buildSentence(cycle);
  }
  const upcoming = sentence[turn];
  return {
    ...state,
    score: state.score + 1,
    cycle,
    turn,
    sentence,
    prevContact: contact,
    nextContact: contact + upcoming.gap,
    mood: upcoming.mood,
    skippedAt: contact,
    crowned: false,
  };
}

function clearLevel(state, contact) {
  const cleared = safeCleared(Math.max(state.cleared, state.level || 0));
  return {
    ...state,
    phase: 'cleared',
    overAt: contact,
    cleared,
    unlocked: unlockedLevel(cleared),
    jump: null,
    crowned: false,
    best: Math.max(state.best, state.score),
  };
}

export function step(state, dt) {
  const frameDt = Number.isFinite(dt) && dt > 0 ? Math.min(dt, MAX_FRAME) : 0;
  let next = { ...state, time: state.time + frameDt };
  const events = [];

  if (next.phase === 'count') {
    if (next.time < COUNTDOWN) return { state: next, events };
    next = { ...next, phase: 'playing' };
  }

  if (next.phase !== 'playing') return { state: next, events };

  if (next.time >= next.nextContact) {
    const contact = next.nextContact;
    if (!feetUp(next.jump, contact)) {
      const crowned = next.score > next.best;
      next = {
        ...next,
        phase: 'over',
        overAt: contact,
        best: Math.max(next.best, next.score),
        crowned,
        jump: null,
        splash: Math.random(),
      };
      events.push('miss');
    } else {
      next = advance(next, contact);
      events.push('skip');
      if (next.mode === 'level' && next.goal && next.score >= next.goal) {
        next = clearLevel(next, contact);
        events.push('clear');
      }
    }
  }

  if (next.phase === 'playing') {
    if (next.jump && next.time > next.jump.start + AIRTIME + GRACE) {
      next = { ...next, landedAt: next.jump.start + AIRTIME, jump: null };
    } else if (next.jump && next.time > next.jump.start + AIRTIME) {
      next = { ...next, landedAt: next.jump.start + AIRTIME };
    }
  }

  return { state: next, events };
}

export function frame(state, dt, input) {
  const events = [];
  let next = state;
  if (input?.steer) {
    next = steer(next, input.steer);
  }
  if (input?.back) {
    next = goBack(next);
  }
  if (input?.pressed) {
    const pressed = press(next, input);
    next = pressed.state;
    events.push(...pressed.events);
  }
  const stepped = step(next, dt);
  return { state: stepped.state, events: [...events, ...stepped.events] };
}
