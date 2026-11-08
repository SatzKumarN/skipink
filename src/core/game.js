import { AIRTIME, BLOT_TIME, COUNTDOWN, DRESSES, GRACE, MAX_FRAME, OPENING_SLACK } from '../config.js';
import { buildSentence } from './sentence.js';

export function createState(best = 0) {
  const safeBest = Number.isFinite(best) && best > 0 ? Math.floor(best) : 0;
  return {
    phase: 'ready',
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
  if (state.phase !== 'over') return 0;
  const current = Number.isFinite(state.dress) ? Math.floor(state.dress) : 0;
  return (current + 1) % DRESSES.length;
}

function startRun(state) {
  const sentence = buildSentence(0);
  const first = sentence[0];
  return {
    state: {
      ...createState(state.best),
      phase: 'count',
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

export function feetUp(jump, contact) {
  if (!jump) return false;
  return contact >= jump.start && contact <= jump.start + AIRTIME + GRACE;
}

export function press(state) {
  if (state.phase === 'ready') return startRun(state);
  if (state.phase === 'over') {
    if (state.time - state.overAt < BLOT_TIME) return { state, events: [] };
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

export function step(state, dt) {
  const frame = Number.isFinite(dt) && dt > 0 ? Math.min(dt, MAX_FRAME) : 0;
  let next = { ...state, time: state.time + frame };
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
    }
  }

  if (next.jump && next.time > next.jump.start + AIRTIME) {
    next = { ...next, landedAt: next.jump.start + AIRTIME, jump: null };
  }

  return { state: next, events };
}

export function frame(state, dt, input) {
  const events = [];
  let next = state;
  if (input?.pressed) {
    const pressed = press(next);
    next = pressed.state;
    events.push(...pressed.events);
  }
  const stepped = step(next, dt);
  return { state: stepped.state, events: [...events, ...stepped.events] };
}
