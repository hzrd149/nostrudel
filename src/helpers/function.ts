// copied from https://dev.to/bwca/create-a-debounce-function-from-scratch-in-typescript-560m
export function debounce<A = unknown, R = void>(fn: (args: A) => R, ms: number): (args: A) => Promise<R> {
  let timer: number;

  const debouncedFunc = (args: A): Promise<R> =>
    new Promise((resolve) => {
      if (timer) {
        window.clearTimeout(timer);
      }

      timer = window.setTimeout(() => {
        resolve(fn(args));
      }, ms);
    });

  return debouncedFunc;
}
