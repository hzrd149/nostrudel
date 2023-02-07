import { useEffect, useRef } from "react";
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
  ref.current = ref.current || new TimelineLoader(relays, query, opts);

  useEffect(() => {
    ref.current?.reset();
    ref.current?.setQuery(query);
  }, [key]);

  const enabled = opts?.enabled ?? true;
  useEffect(() => {
    if (ref.current) {
      if (enabled) ref.current.open();
      else ref.current.close();
    }
  }, [ref, enabled]);

  useUnmount(() => {
    ref.current?.close();
  });

  const events = useSubject(ref.current?.events);
  const loading = useSubject(ref.current.loading);

  return {
    loader: ref.current,
    events,
    loading,
  };
}
