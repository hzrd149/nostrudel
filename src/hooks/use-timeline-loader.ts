import { useEffect, useMemo } from "react";
import { useUnmount } from "react-use";
import { NostrRequestFilter } from "../types/nostr-query";
import timelineCacheService from "../services/timeline-cache";
import { EventFilter } from "../classes/timeline-loader";

type Options = {
  enabled?: boolean;
  eventFilter?: EventFilter;
  cursor?: number;
};

export default function useTimelineLoader(key: string, relays: string[], query: NostrRequestFilter, opts?: Options) {
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
