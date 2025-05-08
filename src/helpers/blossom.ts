/** A method that merges multiple arrays of blossom servers into a single array of unique servers */
export function mergeBlossomServers<T extends URL | string | (string | URL)>(
  ...servers: (T | null | undefined | T[])[]
): T[] {
  let merged: T[] = [];
  const seen = new Set<string>();

  for (const arg of servers) {
    let arr = Array.isArray(arg) ? arg : [arg];
    for (const s of arr) {
      if (s === null || s === undefined) continue;

      const key = new URL("/", s).toString();
      if (seen.has(key)) continue;
      seen.add(key);

      merged.push(s);
    }
  }

  return merged;
}
