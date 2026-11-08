export function mockContext() {
  const calls = [];
  return new Proxy(
    {},
    {
      get(target, prop) {
        if (prop === 'calls') return calls;
        if (prop === 'measureText') {
          return (text) => {
            calls.push(['measureText', text]);
            return { width: String(text).length * 10 };
          };
        }
        if (prop in target) return target[prop];
        if (typeof prop !== 'string') return undefined;
        return (...args) => {
          calls.push([prop, ...args]);
        };
      },
      set(target, prop, value) {
        target[prop] = value;
        calls.push(['set', prop, value]);
        return true;
      },
    },
  );
}

export function styleWas(ctx, name, value) {
  return ctx.calls.some((call) => call[0] === 'set' && call[1] === name && call[2] === value);
}
