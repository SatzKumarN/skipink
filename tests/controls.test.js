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

  it('steers menus and can go back', () => {
    const button = document.createElement('button');
    document.body.append(button);
    const presses = [];
    const steers = [];
    const backs = [];
    const unbind = bindControls(button, window, {
      onPress: (info) => presses.push(info),
      onSteer: (delta, code) => steers.push([delta, code]),
      onBack: () => backs.push('back'),
    });
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowDown', cancelable: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowUp', cancelable: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape', cancelable: true }));
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space', cancelable: true }));
    button.dispatchEvent(new PointerEvent('pointerdown', {
      button: 0,
      clientX: 12,
      clientY: 34,
      cancelable: true,
    }));
    expect(steers).toEqual([[1, 'ArrowDown'], [-1, 'ArrowUp']]);
    expect(backs).toEqual(['back']);
    expect(presses).toHaveLength(2);
    expect(presses[1]).toMatchObject({ x: 12, y: 34, source: 'pointer' });
    unbind();
  });
});
