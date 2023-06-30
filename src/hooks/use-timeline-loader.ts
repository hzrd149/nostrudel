import { useEffect, useMemo } from "react";
import { useUnmount } from "react-use";
import { NostrQuery } from "../types/nostr-query";
import { NostrEvent } from "../types/nostr-event";
import timelineCacheService from "../services/timeline-cache";

type Options = {
  enabled?: boolean;
  eventFilter?: (event: NostrEvent) => boolean;
  cursor?: number;
};

export function useTimelineLoader(key: string, relays: string[], query: NostrQuery, opts?: Options) {
  const timeline = useMemo(() => timelineCacheService.createTimeline(key), [key]);

  useEffect(() => {
    timeline.setQuery(query);
  }, [timeline, JSON.stringify(query)]);
  useEffect(() => {
    timeline.setRelays(relays);
  }, [timeline, relays.join("|")]);
  useEffect(() => {
    timeline.setFilter(opts?.eventFilter);
  }, [timeline, opts?.eventFilter]);
  useEffect(() => {
    if (opts?.cursor !== undefined) {
      timeline.setCursor(opts.cursor);
    }
  }, [timeline, opts?.cursor]);

  const enabled = opts?.enabled ?? true;
  useEffect(() => {
    if (enabled) {
      timeline.setQuery(query);
      timeline.open();
    } else timeline.close();
  }, [timeline, enabled]);

  useUnmount(() => {
    timeline.close();
  });

  return timeline;
}
