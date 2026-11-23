# Skipink

A one-button jump-rope game on a sketchbook page. The skipper holds the rope. It swings over the head and under the shoes. Press once while the rope is under the feet. Every clean skip is one point. The gap between turns changes, and a rope always arrives.

## Play

Open the GitHub Pages site, or run it locally:

```bash
npm install
npm run dev
```

On the title page choose the paint-smear ∞ for an open run, the rising signal bars for ten staged sheets (10 skips, then 20, up to 100), or the head-with-bun mark to pick a skipper. Locked levels open after you clear the one before. The character sheet shows figure previews only: head-with-bun, ballerina, scarecrow, pumpkin, or samurai. Dress color still changes each fresh run. The scarecrow keeps the straw hat, the pumpkin keeps the orange head, and the samurai keeps the helmet; the cloth takes the run color. Space, J, the up arrow, a click, or a tap jumps. Escape goes back. Press V or tap the top-right star symbol to toggle between Classic view (`✧`) and Enhanced view (`✦`). Your best infinity count, cleared levels, character, and view mode stay in the browser.

## Enhanced View

Toggling Enhanced view (`✦`) activates the Living Notebook and Desk World:
- **Game Juice:** Screen shake on miss, score pop scaling, landing dust puffs, and dynamic rope speed trails.
- **Living Notebook:** Breathing idle animations for the skippers, ink bloom on rope contact, and organic paper fiber motion.
- **Desk World:** Ambient wood-grain desk surface with procedural drafting pencils, eraser shavings, a coffee ring, paint palette, and metal paperclip, plus warm desk lamp lighting.
- **Manga Pop-Art Layer:** Dynamic comic sound effect bursts (`HOP!`, `SWOOSH!`, `NICE!`, `PERFECT!`, `FEVER!!` with Japanese subtext), radial speed focus lines, impact shockwaves, expressive emotes (sweatdrops, popping veins `💢`, sparkle stars `✨`), and high-streak anime flame auras.
- **Character Overhaul:** Expressive anime facial features, fluttering hair ribbon physics, tiaras, warrior eyes, and candlelit pumpkin faces.
- **Customization Controls:**
  - 🎨 **Color Picker (<kbd>C</kbd>):** Click the top palette button, press <kbd>C</kbd>, or tap the watercolor paint swatches on the desk to cycle between 6 vibrant outfit colors.
  - 🎲 **Randomizer (<kbd>R</kbd>):** Click the dice button or press <kbd>R</kbd> to randomly select a character and outfit color.
  - 🖼️ **Custom Character Upload (<kbd>U</kbd>):** Click the picture frame button or press <kbd>U</kbd> to upload any PNG/JPEG/SVG doodle or avatar to skip rope with dynamic squash & stretch, landing dust, and manga SFX!
- **Delight & Audio:** Streak fanfare (`streak` and `crown` audio cues), pitch modulation, character-specific particle bursts (notes, straw, leaves, sword arcs, ink droplets), and golden crown celebrations for high scores.
- **Accessibility:** Live ARIA region announcing game states and scores.

## Fonts

The page draws with two SIL Open Font License 1.1 families. The TrueType files are the official releases, unchanged, and each license sits beside its font.

Caveat Brush draws the wordmark, the 3-2-1 countdown, and the score. Copyright 2015 Google Inc. Designed by Impallari Type. License: `src/fonts/caveat-brush/OFL.txt`.

Kalam draws "skips", "best", "new", and the hints. Copyright 2014 Indian Type Foundry. License: `src/fonts/kalam/OFL.txt`.

Both licenses allow this game to bundle the files and serve them from GitHub Pages. The fonts stay under the Open Font License and are not sold on their own. If a face fails to load, the canvas falls back to Georgia.

## Art

Menu controls use original paint-smear symbols that tint the same way: `src/assets/infinity-symbol.png` (∞), `src/assets/levels-symbol.png` (rising bars), `src/assets/characters-symbol.png` (head with bun), and `src/assets/back-symbol.png` (curved return arrow).

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
