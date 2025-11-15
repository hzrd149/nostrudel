import { MonoTypeOperatorFunction, Observable, OperatorFunction, ReplaySubject, scan, share, timer } from "rxjs";

export function scanToArray<T extends unknown>(): OperatorFunction<T, T[]> {
  return (source) => source.pipe(scan((arr, value) => [...arr, value], [] as T[]));
}

/** Share an observable and keep it hot for a given timeout */
export function shareAndHold<T>(timeout: number = 60_000): MonoTypeOperatorFunction<T> {
  return (source) =>
    source.pipe(
      share({
        connector: () => new ReplaySubject(1),
        resetOnRefCountZero: () => timer(timeout),
        resetOnComplete: false,
        resetOnError: false,
      }),
    );
}
