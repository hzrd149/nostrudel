import { useEffect, useRef } from "react";
import { useUnmount } from "react-use";
import { TimelineLoader } from "../classes/timeline-loader";
import { NostrQuery } from "../types/nostr-query";
import { NostrEvent } from "../types/nostr-event";

type Options = {
  enabled?: boolean;
  eventFilter?: (event: NostrEvent) => boolean;
  cursor?: number;
  name?: string;
};

export function useTimelineLoader(key: string, relays: string[], query: NostrQuery, opts?: Options) {
  if (opts && !opts.name) opts.name = key;

  const ref = useRef<TimelineLoader | null>(null);
  const loader = (ref.current = ref.current || new TimelineLoader(relays, query, opts?.name));

  useEffect(() => {
    loader.setQuery(query);
  }, [JSON.stringify(query)]);
  useEffect(() => {
    loader.setRelays(relays);
  }, [relays.join("|")]);
  useEffect(() => {
    loader.setFilter(opts?.eventFilter);
  }, [opts?.eventFilter]);
  useEffect(() => {
    if (opts?.cursor !== undefined) {
      loader.setCursor(opts.cursor);
    }
  }, [opts?.cursor]);

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

  return loader;
}
