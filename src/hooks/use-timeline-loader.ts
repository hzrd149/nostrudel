import { useCallback, useEffect, useRef } from "react";
import { useUnmount } from "react-use";
import { NostrQueryWithStart, TimelineLoader, TimelineLoaderOptions } from "../classes/timeline-loader";
import settings from "../services/settings";
import useSubject from "./use-subject";

type Options = TimelineLoaderOptions & {
  enabled?: boolean;
};

export function useTimelineLoader(key: string, query: NostrQueryWithStart, opts?: Options) {
  const relays = useSubject(settings.relays);
  if (opts && !opts.name) opts.name = key;

  const ref = useRef<TimelineLoader | null>(null);
  const loader = (ref.current = ref.current || new TimelineLoader(relays, query, opts));

  useEffect(() => {
    loader.reset();
    loader.setQuery(query);
  }, [key]);

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
