/** True when the page already runs as an installed app. */
export function isStandaloneDisplay(win = globalThis) {
  try {
    if (win.matchMedia?.('(display-mode: standalone)')?.matches) return true;
    if (win.matchMedia?.('(display-mode: fullscreen)')?.matches) return true;
    if (win.navigator?.standalone === true) return true;
  } catch {
    /* ignore matchMedia failures */
  }
  return false;
}

/**
 * Wire a custom Android/Chrome Install button via beforeinstallprompt.
 * The button stays hidden until the browser says the app can be installed.
 */
export function bindInstallPrompt(button, win = globalThis) {
  if (!button) {
    return {
      dispose() {},
      get deferred() { return null; },
    };
  }

  let deferred = null;

  function show(visible) {
    button.classList.toggle('hidden', !visible);
    button.hidden = !visible;
  }

  function canOffer() {
    return Boolean(deferred) && !isStandaloneDisplay(win);
  }

  function refresh() {
    show(canOffer());
  }

  function onBeforeInstall(event) {
    event.preventDefault();
    deferred = event;
    refresh();
  }

  async function onClick(event) {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (!deferred) return;
    const promptEvent = deferred;
    deferred = null;
    refresh();
    try {
      await promptEvent.prompt();
      await promptEvent.userChoice;
    } catch {
      /* user dismissed or browser blocked the prompt */
    }
    refresh();
  }

  function onAppInstalled() {
    deferred = null;
    refresh();
  }

  show(false);
  if (isStandaloneDisplay(win)) {
    return {
      dispose() {},
      get deferred() { return null; },
    };
  }

  win.addEventListener?.('beforeinstallprompt', onBeforeInstall);
  win.addEventListener?.('appinstalled', onAppInstalled);
  button.addEventListener('pointerdown', onClick);

  return {
    dispose() {
      win.removeEventListener?.('beforeinstallprompt', onBeforeInstall);
      win.removeEventListener?.('appinstalled', onAppInstalled);
      button.removeEventListener('pointerdown', onClick);
      deferred = null;
      show(false);
    },
    get deferred() { return deferred; },
  };
}

/** Register the service worker needed for Android installability. */
export function registerServiceWorker(win = globalThis) {
  const nav = win.navigator;
  if (!nav?.serviceWorker?.register) {
    return Promise.resolve(null);
  }
  const register = () => nav.serviceWorker.register('./sw.js', { scope: './' })
    .catch(() => null);

  if (win.document?.readyState === 'complete') {
    return register();
  }
  return new Promise((resolve) => {
    const onLoad = () => {
      win.removeEventListener?.('load', onLoad);
      resolve(register());
    };
    win.addEventListener?.('load', onLoad);
  });
}
