export const CUES = {
  land: { freq: 220, dur: 0.05, type: 'triangle', gain: 0.07, noise: 0.25 },
  jump: { freq: 140, dur: 0.04, type: 'sine', gain: 0.04, noise: 0.12 },
  blot: { freq: 64, dur: 0.32, type: 'sine', gain: 0.14, noise: 0.55 },
};

export function playCue(ctx, name) {
  const cue = CUES[name];
  if (!ctx || !cue) return false;
  const time = ctx.currentTime || 0;
  const master = ctx.createGain();
  master.gain.setValueAtTime(cue.gain, time);
  master.gain.linearRampToValueAtTime(0.0001, time + cue.dur);
  master.connect(ctx.destination);

  const osc = ctx.createOscillator();
  osc.type = cue.type;
  osc.frequency.setValueAtTime(cue.freq, time);
  osc.connect(master);
  osc.start(time);
  osc.stop(time + cue.dur);

  const rate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(rate * cue.dur));
  const buffer = ctx.createBuffer(1, length, rate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) {
    data[i] = (Math.random() * 2 - 1) * cue.noise;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(cue.noise, time);
  noiseGain.connect(master);
  noise.connect(noiseGain);
  noise.start(time);
  noise.stop(time + cue.dur);
  return true;
}
