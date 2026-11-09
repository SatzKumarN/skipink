import { createSynth, ropeHum } from './audio/synth.js';
import { createState, frame } from './core/game.js';
import { angularVelocity, ropeProgress } from './core/rope.js';
import { viewModel } from './core/present.js';
import { bindControls } from './input/controls.js';
import { drawScene } from './render/draw.js';
import { fitCanvas, readSafeInsets } from './render/fit.js';
import { readBest, writeBest } from './storage.js';

const SOUNDS = { jump: 'jump', start: 'jump', skip: 'land', miss: 'blot' };

export function prefersReducedMotion(env) {
  if (typeof env.reducedMotion === 'boolean') return env.reducedMotion;
  try {
    return Boolean(env.window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
  } catch {
    return false;
  }
}

export function startGame(env) {
  const update = env.update ?? frame;
  const paint = env.paint ?? drawScene;
  const audio = env.audio ?? createSynth(env.window);
  const storage = env.storage;
  let bestWritten = readBest(storage);
  let state = createState(bestWritten);
  const canvas = env.canvas;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser cannot draw the sketchbook page.');
  const button = env.button;
  let pressed = false;
  const reduced = prefersReducedMotion(env);
  const unbind = bindControls(button, env.window, () => {
    audio.unlock?.();
    pressed = true;
  });
  let last = env.now();
  let live = true;

  function tick(now) {
    if (!live) return;
    const result = update(state, (now - last) / 1000, { pressed });
    last = now;
    pressed = false;
    state = result.state;
    result.events.forEach((event) => {
      const cue = SOUNDS[event];
      if (cue) audio.play(cue);
    });
    const speed = state.phase === 'playing'
      ? angularVelocity(
        state.mood,
        ropeProgress(state).u,
        state.nextContact - state.prevContact,
      )
      : 0;
    audio.hum(ropeHum(speed));
    if (state.best !== bestWritten) {
      writeBest(storage, state.best);
      bestWritten = state.best;
    }
    const box = fitCanvas(canvas, env.window);
    context.setTransform(box.dpr, 0, 0, box.dpr, 0, 0);
    const vm = viewModel(state, { clock: now / 1000, reducedMotion: reduced });
    paint(context, box.w, box.h, vm, readSafeInsets(env.window));
    button.textContent = vm.label;
    button.disabled = vm.waiting;
    if (live) env.raf(tick);
  }

  env.raf(tick);
  return {
    getState: () => state,
    stop() {
      live = false;
      unbind();
    },
  };
}
