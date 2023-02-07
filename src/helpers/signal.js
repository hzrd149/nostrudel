export class Signal {
  listeners = [];
  connections = new Set();

  emit(event) {
    for (const [fn, ctx] of this.listeners) {
      if (ctx) {
        fn.apply(ctx, [event]);
      } else fn(event);
    }

    for (const signal of this.connections) {
      signal.emit(event);
    }
  }
  addListener(fn, ctx) {
    this.listeners.push([fn, ctx]);
  }
  removeListener(fn, ctx) {
    this.listeners = this.listeners.filter(
      (listener) => listener.fn !== fn && listener.ctx !== ctx
    );
  }
  addConnection(signal) {
    this.connections.add(signal);
  }
  removeConnection(signal) {
    this.connections.delete(signal);
  }
}
