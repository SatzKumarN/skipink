const JUMP_CODES = new Set(['Space', 'KeyJ', 'ArrowUp']);
const STEER_CODES = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'KeyA',
  'KeyD',
  'KeyW',
  'KeyS',
]);
const STEER_LEFT = new Set(['ArrowLeft', 'ArrowUp', 'KeyA', 'KeyW']);
const BACK_CODES = new Set(['Escape', 'Backspace']);

export function bindControls(button, window, handlers) {
  const onPress = typeof handlers === 'function' ? handlers : handlers.onPress;
  const onSteer = typeof handlers === 'function' ? null : handlers.onSteer;
  const onBack = typeof handlers === 'function' ? null : handlers.onBack;

  const pointerDown = (event) => {
    if (event.button != null && event.button !== 0) return;
    event.preventDefault();
    onPress({
      x: Number.isFinite(event.clientX) ? event.clientX : null,
      y: Number.isFinite(event.clientY) ? event.clientY : null,
      source: 'pointer',
    });
  };
  const keyDown = (event) => {
    if (event.repeat) return;
    if (BACK_CODES.has(event.code)) {
      event.preventDefault();
      onBack?.();
      return;
    }
    if (onSteer && STEER_CODES.has(event.code)) {
      event.preventDefault();
      onSteer(STEER_LEFT.has(event.code) ? -1 : 1, event.code);
      return;
    }
    if (!JUMP_CODES.has(event.code)) return;
    if (event.code === 'Space' && event.target === button) return;
    event.preventDefault();
    onPress({ x: null, y: null, source: 'key' });
  };
  button.addEventListener('pointerdown', pointerDown);
  window.addEventListener('keydown', keyDown);
  return () => {
    button.removeEventListener('pointerdown', pointerDown);
    window.removeEventListener('keydown', keyDown);
  };
}
