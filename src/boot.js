import { startGame } from './runtime.js';

export function boot(globals = globalThis) {
  const doc = globals.document;
  if (!doc) throw new Error('Skipink is missing its page.');
  const canvas = doc.querySelector('#page');
  const button = doc.querySelector('#jump');
  const toggle = doc.querySelector('#view-toggle');
  const colorToggle = doc.querySelector('#color-toggle');
  const randomToggle = doc.querySelector('#random-toggle');
  const uploadToggle = doc.querySelector('#upload-toggle');
  const fileInput = doc.querySelector('#custom-char-file');
  const announcer = doc.querySelector('#announcer');
  if (!canvas || !button) throw new Error('Skipink is missing its page.');
  return startGame({
    canvas,
    button,
    toggle,
    colorToggle,
    randomToggle,
    uploadToggle,
    fileInput,
    announcer,
    window: globals,
    storage: globals.localStorage,
    now: () => globals.performance.now(),
    raf: (fn) => globals.requestAnimationFrame(fn),
  });
}
