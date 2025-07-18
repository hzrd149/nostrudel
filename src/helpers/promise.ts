export function wrapInTimeout<T>(promise: Promise<T>, timeout: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      reject(new Error(message));
    }, timeout);

    promise.then((value) => {
      clearTimeout(t);
      resolve(value);
    });

    promise.catch((err) => {
      clearTimeout(t);
      reject(err);
    });
  });
}
