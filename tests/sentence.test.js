import { describe, expect, it } from 'vitest';
import { MIN_GAP } from '../src/config.js';
import { WAVE_HZ, baseGap, buildSentence, waveGap } from '../src/core/sentence.js';

const SHAPE = [
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

describe('buildSentence', () => {
  it('speaks one fair sentence of moods', () => {
    const sentence = buildSentence(0);
    expect(sentence.map((turn) => turn.mood)).toEqual(SHAPE);
    expect(sentence).toHaveLength(27);
  });

  it('keeps every gap playable and swells as the product of two waves', () => {
    for (let cycle = 0; cycle <= 8; cycle += 1) {
      const sentence = buildSentence(cycle);
      expect(sentence.every((turn) => turn.gap >= MIN_GAP && turn.gap <= 1.35)).toBe(true);
      for (let i = 1; i < sentence.length; i += 1) {
        expect(Math.abs(sentence[i].gap - sentence[i - 1].gap)).toBeLessThan(0.08);
      }
    }
    const t = 6.5;
    const wave = Math.sin(t * Math.PI * 2 * WAVE_HZ[0]) * Math.sin(t * Math.PI * 2 * WAVE_HZ[1]);
    expect(waveGap(t, 0)).toBeCloseTo(baseGap(0) + baseGap(0) * 0.18 * wave);
    expect(waveGap(0, 0)).toBeCloseTo(baseGap(0));
    expect(waveGap(-4, 0)).toBeCloseTo(baseGap(0));
    expect(waveGap(Number.NaN, 0)).toBeCloseTo(baseGap(0));
    expect(waveGap(0, 1)).toBeLessThan(waveGap(0, 0));
    expect(waveGap(0, 8)).toBeGreaterThanOrEqual(MIN_GAP);
  });

  it('treats a missing or fractional cycle as a whole index', () => {
    expect(buildSentence(Number.NaN)).toEqual(buildSentence(0));
    expect(buildSentence(-2)).toEqual(buildSentence(0));
    expect(buildSentence(2.9)).toEqual(buildSentence(2));
  });
});
