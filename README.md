# Skipink

A one-button jump-rope game on a sketchbook page. The skipper holds the rope. It swings over the head and under the shoes. Press once while the rope is under the feet. Every clean skip is one point. The gap between turns changes, and a rope always arrives.

## Play

Open the GitHub Pages site, or run it locally:

```bash
npm install
npm run dev
```

Space, J, the up arrow, a click, or a tap jumps. The same button starts a fresh sheet after a miss. Your best count stays in the browser.

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

## License

The game code is under the MIT License. Simple Inkdrop, the font in `src/fonts/SimpleInkdrop.woff`, keeps the personal-use terms published by its designer, creativeletter. Both are written out in [LICENSE](LICENSE).
