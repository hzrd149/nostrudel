import { use$ } from "applesauce-react/hooks";
import { useMemo } from "react";
import { unique } from "../helpers/array";
import localSettings from "../services/preferences";

// Callers often pass a fresh array literal, so memoize on the joined contents to keep the
// returned array stable across renders and avoid re-opening relay subscriptions
function useMergedRelays(relays: string[], additional?: Iterable<string>) {
  const key = additional ? Array.from(additional).join(",") : undefined;
  return useMemo(() => {
    if (key === undefined) return relays;
    return unique([...relays, ...key.split(",").filter(Boolean)]);
  }, [relays, key]);
}

export function useReadRelays(additional?: Iterable<string>) {
  return useMergedRelays(use$(localSettings.fallbackRelays), additional);
}
export function useWriteRelays(additional?: Iterable<string>) {
  return useMergedRelays(use$(localSettings.extraPublishRelays), additional);
}
