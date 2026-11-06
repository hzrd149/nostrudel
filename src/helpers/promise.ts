/** Resolves independent named operations concurrently while preserving their result types. */
export async function resolvePromises<T extends Record<string, unknown>>(promises: T) {
  const entries = await Promise.all(Object.entries(promises).map(async ([key, value]) => [key, await value]));
  return Object.fromEntries(entries) as { [K in keyof T]: Awaited<T[K]> };
}

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
