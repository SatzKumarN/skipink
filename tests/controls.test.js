import { afterEach, describe, expect, it } from 'vitest';
import { bindControls } from '../src/input/controls.js';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('bindControls', () => {
  it('takes the primary pointer and the jump keys, once', () => {
    const button = document.createElement('button');
    document.body.append(button);
    const presses = [];
    const unbind = bindControls(button, window, () => presses.push('jump'));

    button.dispatchEvent(new Event('pointerdown', { cancelable: true }));
    button.dispatchEvent(new PointerEvent('pointerdown', { button: 0, cancelable: true }));
    button.dispatchEvent(new PointerEvent('pointerdown', { button: 2, cancelable: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyJ', cancelable: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp', cancelable: true }));
    const space = new KeyboardEvent('keydown', { code: 'Space', cancelable: true });
    window.dispatchEvent(space);
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', repeat: true, cancelable: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyK', cancelable: true }));
    button.dispatchEvent(new KeyboardEvent('keydown', {
      code: 'Space',
      bubbles: true,
      cancelable: true,
    }));

    expect(presses).toHaveLength(5);
    expect(space.defaultPrevented).toBe(true);
    unbind();
    button.dispatchEvent(new PointerEvent('pointerdown', { button: 0, cancelable: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyJ', cancelable: true }));
    expect(presses).toHaveLength(5);
  });
});
