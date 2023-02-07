export class Signal {
  listeners = new Set();
  connections = new Set();

  emit(event) {
    for (const fn of this.listeners) {
      fn(event);
    }

    for (const signal of this.connections) {
      signal.emit(event);
    }
  }
  addListener(fn) {
    this.listeners.add(fn);
  }
  removeListener(fn) {
    this.listeners.delete(fn);
  }
  addConnection(signal) {
    this.connections.add(signal);
  }
  removeConnection(signal) {
    this.connections.delete(signal);
  }
}
