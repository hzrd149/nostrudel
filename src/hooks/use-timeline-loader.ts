import { useEffect, useMemo } from "react";
import { useUnmount } from "react-use";
import { Filter, NostrEvent } from "nostr-tools";

import timelineCacheService from "../services/timeline-cache";
import { EventFilter } from "../classes/timeline-loader";

type Options = {
  /** @deprecated */
  enabled?: boolean;
  eventFilter?: EventFilter;
  cursor?: number;
  customSort?: (a: NostrEvent, b: NostrEvent) => number;
};

export default function useTimelineLoader(
  key: string,
  relays: Iterable<string>,
  filters: Filter | Filter[] | undefined,
  opts?: Options,
) {
  const timeline = useMemo(() => timelineCacheService.createTimeline(key), [key]);

  useEffect(() => {
    timeline.setRelays(relays);
    timeline.triggerChunkLoad();
  }, [Array.from(relays).join("|")]);

  useEffect(() => {
    if (filters) {
      timeline.setFilters(Array.isArray(filters) ? filters : [filters]);
      timeline.open();
      timeline.triggerChunkLoad();
    } else timeline.close();
  }, [timeline, JSON.stringify(filters)]);

  useEffect(() => {
    timeline.setEventFilter(opts?.eventFilter);
  }, [timeline, opts?.eventFilter]);
  useEffect(() => {
    if (opts?.cursor !== undefined) {
      timeline.setCursor(opts.cursor);
    }
  }, [timeline, opts?.cursor]);
  useEffect(() => {
    timeline.events.customSort = opts?.customSort;
  }, [timeline, opts?.customSort]);

  useUnmount(() => {
    timeline.close();
  });

  return timeline;
}
