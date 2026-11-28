import { afterEach, describe, expect, it } from 'vitest';
import { boot } from '../src/boot.js';
import { mockContext } from './helpers/mockContext.js';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('boot', () => {
  it('requires the page and the jump button', () => {
    expect(() => boot({})).toThrow(/missing its page/);
    document.body.innerHTML = '<button id="jump"></button>';
    expect(() => boot(window)).toThrow(/missing its page/);
    document.body.innerHTML = '<canvas id="page"></canvas>';
    expect(() => boot(window)).toThrow(/missing its page/);
    document.body.innerHTML = '';
    expect(() => boot()).toThrow(/missing its page/);
  });

  it('starts a game on the real page objects', () => {
    document.body.innerHTML = '<canvas id="page"></canvas><button id="jump"></button><button id="install" class="hidden" hidden></button><button id="view-toggle"></button><div id="announcer"></div>';
    const canvas = document.querySelector('#page');
    canvas.getContext = () => mockContext();
    const queued = [];
    window.requestAnimationFrame = (fn) => {
      queued.push(fn);
      return 1;
    };
    window.matchMedia = () => ({ matches: false });
    window.navigator.serviceWorker = {
      register: () => Promise.resolve({ scope: './' }),
    };
    const game = boot(window);
    queued[0](window.performance.now());
    expect(document.querySelector('#jump').textContent).toBe('Choose');
    expect(document.querySelector('#install').hidden).toBe(true);
    game.stop();
  });
});
