import { boot } from './boot.js';
import inkdropUrl from './fonts/SimpleInkdrop.woff';

const face = new FontFace('Simple Inkdrop', `url(${inkdropUrl})`);
face.load()
  .then((loaded) => {
    document.fonts.add(loaded);
  })
  .catch(() => {})
  .finally(() => boot());
