export const AIRTIME = 0.28;
export const GRACE = 0.04;
export const MIN_GAP = 0.42;
export const BLOT_TIME = 0.7;
export const OPENING_SLACK = 0.22;
export const MAX_FRAME = 0.05;
export const COUNTDOWN = 3;
export const STORAGE_KEY = 'skipink-best';
export const LEGACY_STORAGE_KEY = 'inkskip-best';
export const LEVEL_STORAGE_KEY = 'skipink-cleared';
export const CHARACTER_STORAGE_KEY = 'skipink-character';

export const LEVELS = Array.from({ length: 10 }, (_, index) => ({
  id: index + 1,
  goal: (index + 1) * 10,
}));

export const CHARACTERS = [
  { id: 'bun', label: 'bun' },
  { id: 'ballerina', label: 'ballerina' },
];

export const DEFAULT_CHARACTER = CHARACTERS[0].id;

export const PAGE = { w: 960, h: 640 };

export const ELLIPSE = { cx: 508, cy: 400, rx: 78, ry: 104 };

export const ROPE = {
  wide: 72,
};

export const FIGURE = { x: 500, ground: 508 };

export const COLOR = {
  desk: '#d7c4a8',
  sheet: '#e5d7c2',
  paper: '#f4ead7',
  fiber: '#e3d5bf',
  pencil: '#8d7d68',
  pencilLine: '#b7a790',
  ink: '#1b1714',
  cinnabar: '#c4452d',
  skirt: '#7d72d6',
  skirtDeep: '#5b4fb4',
  skirtShade: '#3e3480',
};

export const DRESSES = [
  { skirt: '#7d72d6', deep: '#5b4fb4' },
  { skirt: '#c45d6a', deep: '#8a3140' },
  { skirt: '#3d6e58', deep: '#244838' },
  { skirt: '#c4842d', deep: '#8a5a16' },
  { skirt: '#3d5a80', deep: '#243652' },
  { skirt: '#8e4d7a', deep: '#5e3052' },
];
