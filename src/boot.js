import { startGame } from './runtime.js';

export function boot(globals = globalThis) {
  const doc = globals.document;
  if (!doc) throw new Error('Inkskip is missing its page.');
  const canvas = doc.querySelector('#page');
  const button = doc.querySelector('#jump');
  if (!canvas || !button) throw new Error('Inkskip is missing its page.');
  return startGame({
    canvas,
    button,
    window: globals,
    storage: globals.localStorage,
    now: () => globals.performance.now(),
    raf: (fn) => globals.requestAnimationFrame(fn),
  });
}
