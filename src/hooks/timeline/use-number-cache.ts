import { useCallback } from "react";
import { LRU } from "tiny-lru";

const cache = new LRU<Map<string, number>>(10);

export type NumberCache = {
  key: string;
  get: (key: string) => number | undefined;
  set: (key: string, value: number) => void;
};

export default function useNumberCache(cacheKey: string): NumberCache {
  const get = useCallback(
    (key: string) => {
      const map = cache.get(cacheKey);
      if (!map) return undefined;

      return map.get(key);
    },
    [cacheKey],
  );

  const set = useCallback(
    (key: string, value: number) => {
      let map = cache.get(cacheKey);
      if (!map) {
        map = new Map();
        cache.set(cacheKey, map);
      }

      return map.set(key, value);
    },
    [cacheKey],
  );

  return { key: cacheKey, get, set };
}
