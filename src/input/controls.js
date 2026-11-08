const CODES = new Set(['Space', 'ArrowUp', 'KeyJ']);

export function bindControls(button, window, onPress) {
  const pointerDown = (event) => {
    if (event.button != null && event.button !== 0) return;
    event.preventDefault();
    onPress();
  };
  const keyDown = (event) => {
    if (event.repeat) return;
    if (!CODES.has(event.code)) return;
    if (event.code === 'Space' && event.target === button) return;
    event.preventDefault();
    onPress();
  };
  button.addEventListener('pointerdown', pointerDown);
  window.addEventListener('keydown', keyDown);
  return () => {
    button.removeEventListener('pointerdown', pointerDown);
    window.removeEventListener('keydown', keyDown);
  };
}
