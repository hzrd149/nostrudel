import { useCallback, useEffect } from "react";

export function useSignal(signal, fn, watch = []) {
  const listener = useCallback(fn, watch);
  useEffect(() => {
    signal.addListener(listener);
    return () => signal.removeListener(listener);
  }, [listener]);
}
