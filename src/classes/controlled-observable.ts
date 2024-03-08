import Observable from "zen-observable";

export default class ControlledObservable<T> implements Observable<T> {
  private observable: Observable<T>;
  private subscriptions = new Set<ZenObservable.SubscriptionObserver<T>>();
  private _complete = false;
  get closed() {
    return this._complete;
  }
  get used() {
    return this.subscriptions.size > 0;
  }

  constructor(subscriber?: ZenObservable.Subscriber<T>) {
    this.observable = new Observable((observer) => {
      this.subscriptions.add(observer);
      const cleanup = subscriber && subscriber(observer);
      return () => {
        this.subscriptions.delete(observer);
        if (typeof cleanup === "function") cleanup();
        else if (cleanup?.unsubscribe) cleanup.unsubscribe();
      };
    });

    this.subscribe = this.observable.subscribe.bind(this.observable);
    this.map = this.observable.map.bind(this.observable);
    this.flatMap = this.observable.flatMap.bind(this.observable);
    this.forEach = this.observable.forEach.bind(this.observable);
    this.reduce = this.observable.reduce.bind(this.observable);
    this.filter = this.observable.filter.bind(this.observable);
    this.concat = this.observable.concat.bind(this.observable);
  }

  next(v: T) {
    if (this._complete) return;
    for (const observer of this.subscriptions) {
      observer.next(v);
    }
  }
  error(err: any) {
    if (this._complete) return;
    for (const observer of this.subscriptions) {
      observer.error(err);
    }
  }
  complete() {
    if (this._complete) return;
    this._complete = true;
    for (const observer of this.subscriptions) {
      observer.complete();
    }
  }

  [Symbol.observable]() {
    return this.observable;
  }
  subscribe: Observable<T>["subscribe"];
  map: Observable<T>["map"];
  flatMap: Observable<T>["flatMap"];
  forEach: Observable<T>["forEach"];
  reduce: Observable<T>["reduce"];
  filter: Observable<T>["filter"];
  concat: Observable<T>["concat"];
}
