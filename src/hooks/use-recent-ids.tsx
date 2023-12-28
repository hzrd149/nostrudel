import { useLocalStorage } from "react-use";
import { useCallback } from "react";

export default function useRecentIds(key: string, maxLength?: number) {
  const [recent = [], setRecent] = useLocalStorage<string[]>("recent-" + key, []);

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
