import { useCallback, useEffect, useRef } from "react";
import { useDeepCompareEffect, useUnmount } from "react-use";
import { NostrQueryWithStart, TimelineLoader, TimelineLoaderOptions } from "../classes/timeline-loader";
import useSubject from "./use-subject";

type Options = TimelineLoaderOptions & {
  enabled?: boolean;
};

export function useTimelineLoader(key: string, relays: string[], query: NostrQueryWithStart, opts?: Options) {
  if (opts && !opts.name) opts.name = key;

  const ref = useRef<TimelineLoader | null>(null);
  const loader = (ref.current = ref.current || new TimelineLoader(relays, query, opts));

  useEffect(() => {
    loader.forgetEvents();
    loader.setQuery(query);
  }, [key]);

  useDeepCompareEffect(() => {
    loader.setRelays(relays);
  }, [relays]);

  const enabled = opts?.enabled ?? true;
  useEffect(() => {
    if (enabled) {
      loader.setQuery(query);
      loader.open();
    } else loader.close();
  }, [enabled]);

  useUnmount(() => {
    loader.close();
  });

  const events = useSubject(loader.events);
  const loading = useSubject(loader.loading);

  const loadMore = useCallback(() => {
    if (enabled) loader.loadMore();
  }, [enabled]);

  return {
    loader,
    events,
    loading,
    loadMore,
  };
}
