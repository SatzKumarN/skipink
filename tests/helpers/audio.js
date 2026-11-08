function node() {
  return {
    connect() {
      return this;
    },
    start() {},
    stop() {},
    frequency: { value: 0, setValueAtTime() {} },
    gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {} },
  };
}

export class FakeAudioContext {
  constructor() {
    this.state = 'suspended';
    this.currentTime = 0;
    this.sampleRate = 800;
    this.destination = {};
    this.resumed = 0;
  }

  resume() {
    this.resumed += 1;
    this.state = 'running';
    return Promise.resolve();
  }

  createGain() {
    return node();
  }

  createOscillator() {
    const osc = node();
    osc.type = '';
    return osc;
  }

  createBiquadFilter() {
    return { ...node(), type: '', frequency: { value: 0 } };
  }

  createBuffer(_channels, length) {
    return { getChannelData: () => new Float32Array(length) };
  }

  createBufferSource() {
    return { ...node(), buffer: null, loop: false };
  }
}
