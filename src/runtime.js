import { DRESS_NAMES, DRESSES } from './config.js';
import { createSynth, ropeHum } from './audio/synth.js';
import { createState, frame } from './core/game.js';
import { menuZoom, pageFromScreen, titleAnchor } from './core/menu.js';
import { angularVelocity, ropeProgress } from './core/rope.js';
import { viewModel } from './core/present.js';
import { bindControls } from './input/controls.js';
import { camera, fitCanvas, readSafeInsets } from './render/fit.js';
import { drawScene, setCustomCharacterImage } from './render/draw.js';
import {
  readBest,
  readCharacter,
  readCleared,
  readCustomCharacter,
  readDress,
  readView,
  writeBest,
  writeCharacter,
  writeCleared,
  writeCustomCharacter,
  writeDress,
  writeView,
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
  let viewMode = readView(storage);
  let dressWritten = readDress(storage);
  let state = createState(bestWritten, clearedWritten, characterWritten);
  state.dress = dressWritten;

  const savedCustom = readCustomCharacter(storage);
  if (savedCustom && typeof Image !== 'undefined') {
    const img = new Image();
    img.onload = () => setCustomCharacterImage(img);
    img.src = savedCustom;
  }

  const canvas = env.canvas;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser cannot draw the sketchbook page.');
  const button = env.button;
  const toggle = env.toggle || null;
  const colorToggle = env.colorToggle || null;
  const randomToggle = env.randomToggle || null;
  const uploadToggle = env.uploadToggle || null;
  const fileInput = env.fileInput || null;
  const announcer = env.announcer || null;
  let lastMessage = '';

  function syncToggle() {
    if (!toggle) return;
    toggle.textContent = viewMode === 'enhanced' ? '✦' : '✧';
    toggle.title = viewMode === 'enhanced' ? 'Switch to classic view' : 'Switch to enhanced view';
    toggle.setAttribute('aria-label', toggle.title);
    toggle.classList.toggle('enhanced', viewMode === 'enhanced');
  }
  syncToggle();

  function onToggle(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    viewMode = viewMode === 'enhanced' ? 'classic' : 'enhanced';
    writeView(storage, viewMode);
    syncToggle();
  }
  if (toggle) toggle.addEventListener('pointerdown', onToggle);

  function onCycleColor(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    state.dress = (state.dress + 1) % DRESSES.length;
    writeDress(storage, state.dress);
    audio.play?.('jump', { freqMultiplier: 1.15 });
    if (announcer) announcer.textContent = `Outfit color: ${DRESS_NAMES[state.dress]}`;
  }
  if (colorToggle) colorToggle.addEventListener('pointerdown', onCycleColor);

  function onRandom(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    const chars = ['bun', 'ballerina', 'scarecrow', 'pumpkin', 'samurai'];
    if (readCustomCharacter(storage)) chars.push('custom');
    const randChar = chars[Math.floor(Math.random() * chars.length)];
    const randDress = Math.floor(Math.random() * DRESSES.length);
    state.character = randChar;
    state.dress = randDress;
    writeCharacter(storage, randChar);
    writeDress(storage, randDress);
    audio.play?.('jump', { freqMultiplier: 1.3 });
    if (announcer) announcer.textContent = `Randomized: ${randChar} (${DRESS_NAMES[randDress]})`;
  }
  if (randomToggle) randomToggle.addEventListener('pointerdown', onRandom);

  function onUpload(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    fileInput?.click?.();
  }
  if (uploadToggle) uploadToggle.addEventListener('pointerdown', onUpload);

  function onFileChange(event) {
    const file = event?.target?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e?.target?.result;
      if (typeof dataUrl === 'string') {
        writeCustomCharacter(storage, dataUrl);
        if (typeof Image !== 'undefined') {
          const img = new Image();
          img.onload = () => setCustomCharacterImage(img);
          img.src = dataUrl;
        }
        state.character = 'custom';
        writeCharacter(storage, 'custom');
        audio.play?.('crown');
        if (announcer) announcer.textContent = 'Custom character uploaded!';
      }
    };
    reader.readAsDataURL(file);
  }
  if (fileInput) fileInput.addEventListener('change', onFileChange);

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
    onToggleView() {
      onToggle();
    },
    onCycleColor() {
      onCycleColor();
    },
    onRandom() {
      onRandom();
    },
    onUpload() {
      onUpload();
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
    if (pointing.x != null && pointing.y != null) {
      if (pointing.x >= 25 && pointing.x <= 115 && pointing.y >= 460 && pointing.y <= 540) {
        const col = Math.min(2, Math.max(0, Math.floor((pointing.x - 25) / 30)));
        const row = Math.min(1, Math.max(0, Math.floor((pointing.y - 460) / 40)));
        const idx = row * 3 + col;
        state.dress = idx;
        writeDress(storage, idx);
        audio.play?.('jump', { freqMultiplier: 1.15 });
        if (announcer) announcer.textContent = `Outfit color: ${DRESS_NAMES[idx]}`;
      }
    }
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
      let cue = SOUNDS[event];
      let options = undefined;
      if (viewMode === 'enhanced') {
        if (event === 'skip') {
          if (state.score > 0 && state.score % 5 === 0) {
            cue = 'streak';
          } else {
            options = { freqMultiplier: 1 + (state.score % 10) * 0.02 };
          }
        } else if (event === 'clear') {
          cue = 'crown';
        }
      }
      if (cue) {
        if (options) audio.play(cue, options);
        else audio.play(cue);
      }
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
      enhanced: viewMode === 'enhanced',
    });
    paint(context, box.w, box.h, vm, lastInsets);
    button.textContent = vm.label;
    button.disabled = vm.waiting;
    if (announcer) {
      let msg = '';
      if (state.phase === 'playing') msg = `Score ${state.score}`;
      else if (state.phase === 'over') msg = `Game over. Score ${state.score}`;
      else if (state.phase === 'cleared') msg = `Level cleared. Score ${state.score}`;
      else if (state.phase === 'count' && vm.count) msg = String(vm.count);
      if (msg && msg !== lastMessage) {
        announcer.textContent = msg;
        lastMessage = msg;
      }
    }
    if (live) env.raf(tick);
  }

  env.raf(tick);
  return {
    getState: () => state,
    stop() {
      live = false;
      unbind();
      if (toggle) toggle.removeEventListener('pointerdown', onToggle);
      if (colorToggle) colorToggle.removeEventListener('pointerdown', onCycleColor);
      if (randomToggle) randomToggle.removeEventListener('pointerdown', onRandom);
      if (uploadToggle) uploadToggle.removeEventListener('pointerdown', onUpload);
      if (fileInput) fileInput.removeEventListener('change', onFileChange);
    },
  };
}
