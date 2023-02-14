export type Deferred<T> = Promise<T> & {
  resolve: (value?: T | PromiseLike<T>) => void;
  reject: (reason?: any) => void;
};

export default function createDefer<T>() {
  let _resolve: (value?: T | PromiseLike<T>) => void;
  let _reject: (reason?: any) => void;
  const promise = new Promise<T>((resolve, reject) => {
    // @ts-ignore
    _resolve = resolve;
    _reject = reject;
  }) as Deferred<T>;

  // @ts-ignore
  promise.resolve = _resolve;
  // @ts-ignore
  promise.reject = _reject;

  return promise;
}
