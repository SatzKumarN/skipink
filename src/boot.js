import { startGame } from './runtime.js';

export function boot(globals = globalThis) {
  const doc = globals.document;
  if (!doc) throw new Error('Skipink is missing its page.');
  const canvas = doc.querySelector('#page');
  const button = doc.querySelector('#jump');
  const toggle = doc.querySelector('#view-toggle');
  const announcer = doc.querySelector('#announcer');
  if (!canvas || !button) throw new Error('Skipink is missing its page.');
  return startGame({
    canvas,
    button,
    toggle,
    announcer,
    window: globals,
    storage: globals.localStorage,
    now: () => globals.performance.now(),
    raf: (fn) => globals.requestAnimationFrame(fn),
  });
}
