# Skipink

A one-button jump-rope game on a sketchbook page. The skipper holds the rope. It swings over the head and under the shoes. Press once while the rope is under the feet. Every clean skip is one point. The gap between turns changes, and a rope always arrives.

## Play

Open the GitHub Pages site, or run it locally:

```bash
npm install
npm run dev
```

Space, J, the up arrow, a click, or a tap jumps. The same button starts a fresh sheet after a miss. Your best count stays in the browser.

## Fonts

The page used to draw every word in Simple Inkdrop. That face is free for personal use only, so the build no longer ships it. Two SIL Open Font License 1.1 families replace it. The TrueType files are the official releases, unchanged, and each license sits beside its font.

Caveat Brush draws the wordmark, the 3-2-1 countdown, and the score. Copyright 2015 Google Inc. Designed by Impallari Type. License: `src/fonts/caveat-brush/OFL.txt`.

Kalam draws "skips", "best", "new", and the hints. Copyright 2014 Indian Type Foundry. License: `src/fonts/kalam/OFL.txt`.

Both licenses allow this game to bundle the files and serve them from GitHub Pages. The fonts stay under the Open Font License and are not sold on their own. If a face fails to load, the canvas falls back to Georgia.

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
