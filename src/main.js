import { boot } from './boot.js';
import brushUrl from './fonts/caveat-brush/CaveatBrush-Regular.ttf';
import penUrl from './fonts/kalam/Kalam-Regular.ttf';

function loadFace(family, url) {
  const face = new FontFace(family, `url(${url})`);
  return face.load().then((loaded) => {
    document.fonts.add(loaded);
  });
}

Promise.allSettled([
  loadFace('Caveat Brush', brushUrl),
  loadFace('Kalam', penUrl),
]).finally(() => boot());
