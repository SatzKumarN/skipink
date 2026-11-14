# Skipink

A one-button jump-rope game on a sketchbook page. The skipper holds the rope. It swings over the head and under the shoes. Press once while the rope is under the feet. Every clean skip is one point. The gap between turns changes, and a rope always arrives.

## Play

Open the GitHub Pages site, or run it locally:

```bash
npm install
npm run dev
```

On the title page choose the paint-smear ∞ for an open run, or the rising signal bars for ten staged sheets (10 skips, then 20, up to 100). Locked levels open after you clear the one before. Space, J, the up arrow, a click, or a tap jumps. Escape goes back. Your best infinity count and cleared levels stay in the browser.

## Fonts

The page draws with two SIL Open Font License 1.1 families. The TrueType files are the official releases, unchanged, and each license sits beside its font.

Caveat Brush draws the wordmark, the 3-2-1 countdown, and the score. Copyright 2015 Google Inc. Designed by Impallari Type. License: `src/fonts/caveat-brush/OFL.txt`.

Kalam draws "skips", "best", "new", and the hints. Copyright 2014 Indian Type Foundry. License: `src/fonts/kalam/OFL.txt`.

Both licenses allow this game to bundle the files and serve them from GitHub Pages. The fonts stay under the Open Font License and are not sold on their own. If a face fails to load, the canvas falls back to Georgia.

## Art

Menu controls use original paint-smear symbols that tint the same way: `src/assets/infinity-symbol.png` (∞), `src/assets/levels-symbol.png` (rising bars), and `src/assets/back-symbol.png` (curved return arrow).

## Layout

- `src/core` keeps the rules: sentences, rope motion, scoring, and the on-page view model
- `src/render` fits and draws the page
- `src/audio` makes the rope, the landing tick, and the blot
- `src/input` maps the button and the keyboard
- `src/runtime.js` ties a frame together
- `src/main.js` is the page entry

## Tests

```bash
npm test
```

Coverage is required at 95% lines, branches, functions, and statements. `src/main.js` only calls `boot()` and is left out of that gate.

## GitHub Pages

Pushes to `main` run the tests, build the static page, and deploy `dist`. The site path is relative, so it works as a project page or a user page.
