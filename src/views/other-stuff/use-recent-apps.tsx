import { useLocalStorage } from "react-use";
import { useCallback } from "react";

export default function useRecentApps() {
  const [recentApps = [], setRecentApps] = useLocalStorage<string[]>("recent-apps", []);

  const useApp = useCallback(
    (app: string) => {
      setRecentApps((arr = []) => {
        return [app].concat(...arr.filter((a) => a !== app));
      });
    },
    [setRecentApps],
  );

  return { recentApps, useApp };
}
