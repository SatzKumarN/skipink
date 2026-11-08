export const WAVE_HZ = [0.05, 0.08];

const MOODS = [
  ...Array(8).fill('even'),
  ...Array(6).fill('hurry'),
  ...Array(2).fill('ease'),
  'hang',
  'snap',
  ...Array(4).fill('even'),
  'snap',
  'snap',
  'even',
  'snap',
  'snap',
];

function cycleIndex(cycle) {
  if (!Number.isFinite(cycle) || cycle <= 0) return 0;
  return Math.floor(cycle);
}

export function baseGap(cycle) {
  return Math.max(0.52, 0.86 * 0.9 ** cycleIndex(cycle));
}

export function waveGap(time, cycle) {
  const t = Number.isFinite(time) && time > 0 ? time : 0;
  const mid = baseGap(cycle);
  const depth = mid * 0.18;
  const wave = Math.sin(t * Math.PI * 2 * WAVE_HZ[0]) * Math.sin(t * Math.PI * 2 * WAVE_HZ[1]);
  return mid + depth * wave;
}

export function buildSentence(cycle) {
  const index = cycleIndex(cycle);
  let time = 0;
  return MOODS.map((mood) => {
    const gap = waveGap(time, index);
    time += gap;
    return { mood, gap };
  });
}
