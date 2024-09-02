import { useCallback, useEffect, useState } from "react";

export default function useRecentIds(key: string, maxLength?: number) {
  const value = localStorage.getItem("recent-" + key);
  const recent = value ? (JSON.parse(value) as string[]) : [];

  const [_, update] = useState(0);
  useEffect(() => {
    const listener = (e: StorageEvent) => {
      if (e.key === key) update(Math.random());
    };
    window.addEventListener("storage", listener);

    return () => window.removeEventListener("storage", listener);
  }, [key, update]);

  const setRecent = useCallback((recent: string[] | ((recent: string[]) => string[])) => {
    if (typeof recent === "function") {
      const value = localStorage.getItem("recent-" + key);
      const newArr = recent(value ? (JSON.parse(value) as string[]) : []);
      localStorage.setItem("recent-" + key, JSON.stringify(newArr));
    } else localStorage.setItem("recent-" + key, JSON.stringify(recent));
  }, []);

  const useThing = useCallback(
    (app: string) => {
      setRecent((arr = []) => {
        const newArr = [app].concat(...arr.filter((a) => a !== app));
        if (maxLength) return newArr.slice(0, maxLength);
        else return newArr;
      });
    },
    [setRecent],
  );

  return { recent, useThing };
}
