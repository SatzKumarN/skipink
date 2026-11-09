import { describe, expect, it } from 'vitest';
import { playCue } from '../src/audio/cues.js';
import { createSynth, ropeHum } from '../src/audio/synth.js';
import { FakeAudioContext } from './helpers/audio.js';

describe('playCue', () => {
  it('plays a known cue and ignores anything else', () => {
    expect(playCue(null, 'land')).toBe(false);
    expect(playCue(new FakeAudioContext(), 'nope')).toBe(false);
    const quiet = new FakeAudioContext();
    quiet.currentTime = 0;
    expect(playCue(quiet, 'land')).toBe(true);
    const timed = new FakeAudioContext();
    timed.currentTime = 2;
    timed.sampleRate = 1;
    expect(playCue(timed, 'blot')).toBe(true);
  });
});

describe('ropeHum', () => {
  it('scales a forward speed and stays quiet otherwise', () => {
    expect(ropeHum(Number.NaN)).toBe(0);
    expect(ropeHum(0)).toBe(0);
    expect(ropeHum(-2)).toBe(0);
    expect(ropeHum(3.6)).toBeCloseTo(0.02);
    expect(ropeHum(1800)).toBe(0.05);
  });
});

describe('createSynth', () => {
  it('stays quiet until unlock, and prefers the standard context', () => {
    let made = '';
    class First extends FakeAudioContext {
      constructor() {
        super();
        made = 'first';
      }
    }
    class Second extends FakeAudioContext {
      constructor() {
        super();
        made = 'second';
      }
    }
    const both = createSynth({ AudioContext: First, webkitAudioContext: Second });
    expect(both.play('jump')).toBe(false);
    expect(both.hum(1)).toBe(0);
    expect(made).toBe('');
    expect(both.unlock()).toBe(true);
    expect(made).toBe('first');
    expect(both.play('jump')).toBe(true);
    expect(both.unlock()).toBe(true);
    expect(both.play('jump')).toBe(true);
    const prefixed = createSynth({ webkitAudioContext: Second });
    expect(prefixed.unlock()).toBe(true);
    expect(prefixed.play('land')).toBe(true);
    expect(made).toBe('second');
    const silent = createSynth({});
    expect(silent.unlock()).toBe(false);
    expect(silent.play('land')).toBe(false);
    expect(silent.hum(1)).toBe(0);
  });

  it('starts the hum once and clamps it', () => {
    let buffers = 0;
    class Counting extends FakeAudioContext {
      createBuffer(...args) {
        buffers += 1;
        return super.createBuffer(...args);
      }
    }
    const synth = createSynth({ AudioContext: Counting });
    expect(synth.hum(1)).toBe(0);
    expect(buffers).toBe(0);
    synth.unlock();
    expect(synth.hum(1)).toBe(0.05);
    expect(synth.hum(0)).toBe(0);
    expect(synth.hum(Number.NaN)).toBe(0);
    expect(buffers).toBe(1);
  });

  it('resumes while suspended and still plays when resume is missing', () => {
    let resumes = 0;
    class Holding extends FakeAudioContext {
      resume() {
        resumes += 1;
        return Promise.resolve();
      }
    }
    const held = createSynth({ AudioContext: Holding });
    expect(held.unlock()).toBe(true);
    expect(held.unlock()).toBe(true);
    expect(resumes).toBe(2);
    expect(held.play('jump')).toBe(true);

    class Stuck {
      constructor() {
        this.state = 'suspended';
        this.currentTime = 0;
        this.sampleRate = 200;
        this.destination = {};
      }

      createGain() {
        return new FakeAudioContext().createGain();
      }

      createOscillator() {
        return new FakeAudioContext().createOscillator();
      }

      createBuffer(channels, length, rate) {
        return new FakeAudioContext().createBuffer(channels, length, rate);
      }

      createBufferSource() {
        return new FakeAudioContext().createBufferSource();
      }
    }
    const synth = createSynth({ AudioContext: Stuck });
    expect(synth.unlock()).toBe(true);
    expect(synth.play('jump')).toBe(true);
    let runningResumes = 0;
    const running = createSynth({
      AudioContext: class extends FakeAudioContext {
        constructor() {
          super();
          this.state = 'running';
        }

        resume() {
          runningResumes += 1;
          return super.resume();
        }
      },
    });
    expect(running.unlock()).toBe(true);
    expect(runningResumes).toBe(0);
    expect(running.play('land')).toBe(true);
    expect(running.play('nope')).toBe(false);
  });
});
