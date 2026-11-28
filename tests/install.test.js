import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  bindInstallPrompt,
  isStandaloneDisplay,
  registerServiceWorker,
} from '../src/install.js';

afterEach(() => {
  document.body.innerHTML = '';
});

function makeButton() {
  const button = document.createElement('button');
  button.className = 'install-btn hidden';
  button.hidden = true;
  document.body.append(button);
  return button;
}

describe('isStandaloneDisplay', () => {
  it('detects standalone, fullscreen, and iOS standalone flags', () => {
    expect(isStandaloneDisplay({
      matchMedia: (query) => ({ matches: query.includes('standalone') }),
    })).toBe(true);
    expect(isStandaloneDisplay({
      matchMedia: (query) => ({ matches: query.includes('fullscreen') }),
    })).toBe(true);
    expect(isStandaloneDisplay({
      matchMedia: () => ({ matches: false }),
      navigator: { standalone: true },
    })).toBe(true);
    expect(isStandaloneDisplay({
      matchMedia: () => ({ matches: false }),
      navigator: {},
    })).toBe(false);
    expect(isStandaloneDisplay({
      matchMedia: () => { throw new Error('no media'); },
    })).toBe(false);
  });
});

describe('bindInstallPrompt', () => {
  it('no-ops without a button', () => {
    const handle = bindInstallPrompt(null, window);
    expect(handle.deferred).toBeNull();
    handle.dispose();
  });

  it('stays hidden when already installed', () => {
    const button = makeButton();
    const handle = bindInstallPrompt(button, {
      matchMedia: () => ({ matches: true }),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    expect(button.classList.contains('hidden')).toBe(true);
    expect(button.hidden).toBe(true);
    handle.dispose();
  });

  it('shows the button after beforeinstallprompt and prompts on tap', async () => {
    const button = makeButton();
    const listeners = new Map();
    const win = {
      matchMedia: () => ({ matches: false }),
      addEventListener: (type, fn) => listeners.set(type, fn),
      removeEventListener: (type) => listeners.delete(type),
      navigator: {},
    };
    const handle = bindInstallPrompt(button, win);
    expect(button.classList.contains('hidden')).toBe(true);

    const userChoice = Promise.resolve({ outcome: 'accepted' });
    const prompt = vi.fn(() => Promise.resolve());
    const event = {
      preventDefault: vi.fn(),
      prompt,
      userChoice,
    };
    listeners.get('beforeinstallprompt')(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(button.classList.contains('hidden')).toBe(false);
    expect(button.hidden).toBe(false);
    expect(handle.deferred).toBe(event);

    button.dispatchEvent(new PointerEvent('pointerdown', { button: 0, cancelable: true }));
    await Promise.resolve();
    await userChoice;
    expect(prompt).toHaveBeenCalled();
    expect(handle.deferred).toBeNull();

    listeners.get('beforeinstallprompt')({
      preventDefault: vi.fn(),
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'dismissed' }),
    });
    listeners.get('appinstalled')();
    expect(button.classList.contains('hidden')).toBe(true);
    handle.dispose();
    expect(listeners.size).toBe(0);
  });

  it('swallows prompt errors and refreshes visibility', async () => {
    const button = makeButton();
    const listeners = new Map();
    const win = {
      matchMedia: () => ({ matches: false }),
      addEventListener: (type, fn) => listeners.set(type, fn),
      removeEventListener: (type) => listeners.delete(type),
      navigator: {},
    };
    const handle = bindInstallPrompt(button, win);
    const event = {
      preventDefault: vi.fn(),
      prompt: vi.fn(() => Promise.reject(new Error('blocked'))),
      userChoice: Promise.resolve({ outcome: 'dismissed' }),
    };
    listeners.get('beforeinstallprompt')(event);
    button.dispatchEvent(new PointerEvent('pointerdown', { button: 0, cancelable: true }));
    await Promise.resolve();
    await Promise.resolve();
    expect(button.classList.contains('hidden')).toBe(true);
    handle.dispose();
  });
});

describe('registerServiceWorker', () => {
  it('skips when service workers are unavailable', async () => {
    await expect(registerServiceWorker({ navigator: {} })).resolves.toBeNull();
  });

  it('registers immediately when the document is complete', async () => {
    const register = vi.fn(() => Promise.resolve({ scope: './' }));
    const result = await registerServiceWorker({
      navigator: { serviceWorker: { register } },
      document: { readyState: 'complete' },
    });
    expect(register).toHaveBeenCalledWith('./sw.js', { scope: './' });
    expect(result).toEqual({ scope: './' });
  });

  it('waits for load when the document is still loading', async () => {
    const register = vi.fn(() => Promise.resolve({ scope: './' }));
    const listeners = new Map();
    const pending = registerServiceWorker({
      navigator: { serviceWorker: { register } },
      document: { readyState: 'loading' },
      addEventListener: (type, fn) => listeners.set(type, fn),
      removeEventListener: (type) => listeners.delete(type),
    });
    expect(register).not.toHaveBeenCalled();
    listeners.get('load')();
    await expect(pending).resolves.toEqual({ scope: './' });
    expect(listeners.size).toBe(0);
  });

  it('returns null when registration fails', async () => {
    const register = vi.fn(() => Promise.reject(new Error('no sw')));
    await expect(registerServiceWorker({
      navigator: { serviceWorker: { register } },
      document: { readyState: 'complete' },
    })).resolves.toBeNull();
  });
});
