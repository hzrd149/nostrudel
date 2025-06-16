import { Observable, OperatorFunction, scan } from "rxjs";

export function scanToArray<T extends unknown>(): OperatorFunction<T, T[]> {
  return (source) => source.pipe(scan((arr, value) => [...arr, value], [] as T[]));
}
