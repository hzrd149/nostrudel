import Observable from "zen-observable";
import { nanoid } from "nanoid";
import ControlledObservable from "./controlled-observable";

/** An observable that is always open and stores the last value */
export default class Subject<T> {
  private observable: ControlledObservable<T>;
  id = nanoid(8);
  value: T | undefined;

  constructor(value?: T) {
    this.observable = new ControlledObservable();

    this.value = value;
    this.subscribe = this.observable.subscribe.bind(this.observable);
  }

  next(v: T) {
    this.value = v;
    this.observable.next(v);
  }
  error(err: any) {
    this.observable.error(err);
  }

  [Symbol.observable]() {
    return this.observable;
  }
  subscribe: Observable<T>["subscribe"];

  map<R>(callback: (value: T) => R, defaultValue?: R): Subject<R> {
    const child = new Subject(defaultValue);

    this.subscribe((value) => {
      try {
        child.next(callback(value));
      } catch (e) {
        child.error(e);
      }
    });

    return child;
  }

  /** @deprecated */
  connectWithMapper<R>(
    subject: Subject<R>,
    map: (value: R, next: (value: T) => void, current: T | undefined) => void,
  ): ZenObservable.Subscription {
    return subject.subscribe((value) => {
      map(value, (v) => this.next(v), this.value);
    });
  }
}

export class PersistentSubject<T> extends Subject<T> {
  value: T;
  constructor(value: T) {
    super();
    this.value = value;
  }
}
