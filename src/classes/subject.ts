export type ListenerFn<T> = (value: T) => void;
interface Connectable<Value> {
  value?: Value;
  subscribe(listener: ListenerFn<Value>, ctx?: Object): this;
  unsubscribe(listener: ListenerFn<Value>, ctx?: Object): this;
}
interface ConnectableApi<T> {
  connect(connectable: Connectable<T>): this;
  disconnect(connectable: Connectable<T>): this;
}
type Connection<From, To = From, Prev = To> = (value: From, next: (value: To) => any, prevValue: Prev) => void;

export class Subject<Value> implements Connectable<Value> {
  listeners: [ListenerFn<Value>, Object | undefined][] = [];

  value?: Value;
  constructor(value?: Value) {
    this.value = value;
  }

  next(value: Value) {
    this.value = value;
    for (const [listener, ctx] of this.listeners) {
      if (ctx) listener.call(ctx, value);
      else listener(value);
    }
    return this;
  }

  private findListener(callback: ListenerFn<Value>, ctx?: Object) {
    return this.listeners.find((l) => {
      return l[0] === callback && l[1] === ctx;
    });
  }

  subscribe(listener: ListenerFn<Value>, ctx?: Object) {
    if (!this.findListener(listener, ctx)) {
      this.listeners.push([listener, ctx]);

      if (this.value !== undefined) {
        if (ctx) listener.call(ctx, this.value);
        else listener(this.value);
      }
    }
    return this;
  }
  unsubscribe(listener: ListenerFn<Value>, ctx?: Object) {
    const entry = this.findListener(listener, ctx);
    if (entry) {
      this.listeners = this.listeners.filter((l) => l !== entry);
    }
    return this;
  }
  get hasListeners() {
    return this.listeners.length > 0;
  }

  upstream = new Map<Connectable<any>, ListenerFn<any>>();

  connect(connectable: Connectable<Value>) {
    if (!this.upstream.has(connectable)) {
      const handler = this.next;
      this.upstream.set(connectable, handler);
      connectable.subscribe(handler, this);

      if (connectable.value !== undefined) {
        handler(connectable.value);
      }
    }
    return this;
  }
  connectWithHandler<From>(connectable: Connectable<From>, connection: Connection<From, Value, typeof this.value>) {
    if (!this.upstream.has(connectable)) {
      const handler = (value: From) => {
        connection(value, this.next.bind(this), this.value);
      };
      this.upstream.set(connectable, handler);
      connectable.subscribe(handler, this);
    }
    return this;
  }
  disconnect(connectable: Connectable<any>) {
    const handler = this.upstream.get(connectable);
    if (handler) {
      this.upstream.delete(connectable);
      connectable.unsubscribe(handler, this);
    }
    return this;
  }
}

export class PersistentSubject<Value> extends Subject<Value> implements ConnectableApi<Value> {
  value: Value;
  constructor(value: Value) {
    super();
    this.value = value;
  }
}

export default Subject;
