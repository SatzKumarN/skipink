import { createSynth, ropeHum } from './audio/synth.js';
import { createState, frame } from './core/game.js';
import { menuZoom, pageFromScreen, titleAnchor } from './core/menu.js';
import { angularVelocity, ropeProgress } from './core/rope.js';
import { viewModel } from './core/present.js';
import { bindControls } from './input/controls.js';
import { camera, fitCanvas, readSafeInsets } from './render/fit.js';
import { drawScene } from './render/draw.js';
import {
  readBest,
  readCharacter,
  readCleared,
  writeBest,
  writeCharacter,
  writeCleared,
} from './storage.js';

const SOUNDS = { jump: 'jump', start: 'jump', skip: 'land', miss: 'blot', clear: 'land' };
const PHONE_STAGE = { x: 330, y: 0, w: 340, h: 640 };
const PLAY_JUMP_KEYS = new Set(['ArrowUp', 'KeyW']);

function phoneLayout(width, height) {
  return width > 0 && width < 760 && height > width;
}

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
  let clearedWritten = readCleared(storage);
  let characterWritten = readCharacter(storage);
  let state = createState(bestWritten, clearedWritten, characterWritten);
  const canvas = env.canvas;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser cannot draw the sketchbook page.');
  const button = env.button;
  let pressed = false;
  let pointer = null;
  let steer = 0;
  let back = false;
  let lastBox = { w: 1, h: 1 };
  let lastInsets = { top: 0, right: 0, bottom: 0, left: 0 };
  const reduced = prefersReducedMotion(env);
  const unbind = bindControls(button, env.window, {
    onPress(info) {
      audio.unlock?.();
      pressed = true;
      pointer = info || null;
    },
    onSteer(delta, code) {
      if (state.phase === 'menu' || state.phase === 'levels' || state.phase === 'characters') {
        steer = delta;
        return;
      }
      if (PLAY_JUMP_KEYS.has(code)) {
        audio.unlock?.();
        pressed = true;
        pointer = { x: null, y: null, source: 'key' };
      }
    },
    onBack() {
      back = true;
    },
  });
  let last = env.now();
  let live = true;

  function resolvePointer(info, phone) {
    if (!info || !Number.isFinite(info.x) || !Number.isFinite(info.y)) {
      return { x: null, y: null, phone };
    }
    const stage = phone ? PHONE_STAGE : null;
    const cam = camera(lastBox.w, lastBox.h, stage, lastInsets);
    const focus = titleAnchor(phone);
    const browsing = state.phase === 'menu'
      || state.phase === 'levels'
      || state.phase === 'characters';
    const zoom = browsing ? menuZoom(phone) : 1 + (phone ? 0.32 : 1.05);
    const page = pageFromScreen(info.x, info.y, cam, focus, zoom);
    return { x: page.x, y: page.y, phone };
  }

  function tick(now) {
    if (!live) return;
    const phone = phoneLayout(lastBox.w, lastBox.h);
    const pointing = resolvePointer(pointer, phone);
    const result = update(state, (now - last) / 1000, {
      pressed,
      steer,
      back,
      x: pointing.x,
      y: pointing.y,
      phone,
    });
    last = now;
    pressed = false;
    pointer = null;
    steer = 0;
    back = false;
    state = result.state;
    result.events.forEach((event) => {
      const cue = SOUNDS[event];
      if (cue) audio.play(cue);
    });
    const speed = state.phase === 'playing'
      ? angularVelocity(
        ropeProgress(state).u,
        state.nextContact - state.prevContact,
      )
      : 0;
    audio.hum(ropeHum(speed));
    if (state.best !== bestWritten) {
      writeBest(storage, state.best);
      bestWritten = state.best;
    }
    if (state.cleared !== clearedWritten) {
      writeCleared(storage, state.cleared);
      clearedWritten = state.cleared;
    }
    if (state.character !== characterWritten) {
      writeCharacter(storage, state.character);
      characterWritten = state.character;
    }
    const box = fitCanvas(canvas, env.window);
    lastBox = box;
    lastInsets = readSafeInsets(env.window);
    context.setTransform(box.dpr, 0, 0, box.dpr, 0, 0);
    const vm = viewModel(state, {
      clock: now / 1000,
      reducedMotion: reduced,
      phone: phoneLayout(box.w, box.h),
    });
    paint(context, box.w, box.h, vm, lastInsets);
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
