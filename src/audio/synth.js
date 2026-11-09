import { playCue } from './cues.js';

export function ropeHum(speed) {
  if (!Number.isFinite(speed) || speed <= 0) return 0;
  return Math.min(0.05, speed / 180);
}

export function createSynth(window) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let ctx = null;
  let humGain = null;

  function unlock() {
    if (!AudioCtx) return false;
    if (!ctx) ctx = new AudioCtx();
    if (ctx.state === 'suspended' && typeof ctx.resume === 'function') ctx.resume();
    return true;
  }

  return {
    unlock,
    play(name) {
      if (!ctx) return false;
      return playCue(ctx, name);
    },
    hum(level) {
      if (!ctx) return 0;
      const amount = Math.max(0, Math.min(0.05, Number(level) || 0));
      if (!humGain) {
        const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 700;
        humGain = ctx.createGain();
        humGain.gain.value = 0;
        source.connect(filter);
        filter.connect(humGain);
        humGain.connect(ctx.destination);
        source.start();
      }
      humGain.gain.value = amount;
      return amount;
    },
  };
}
