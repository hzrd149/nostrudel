import { useEffect, useMemo } from "react";
import { usePrevious, useUnmount } from "react-use";
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

  // update relays
  useEffect(() => {
    timeline.setRelays(relays);
    timeline.triggerChunkLoad();
  }, [Array.from(relays).join("|")]);

  // update filters
  useEffect(() => {
    if (filters) {
      timeline.setFilters(Array.isArray(filters) ? filters : [filters]);
      timeline.open();
      timeline.triggerChunkLoad();
    } else timeline.close();
  }, [timeline, JSON.stringify(filters)]);

  // update event filter
  useEffect(() => {
    timeline.setEventFilter(opts?.eventFilter);
  }, [timeline, opts?.eventFilter]);

  // update cursor
  // NOTE: I don't think this is used anywhere and should be removed
  useEffect(() => {
    if (opts?.cursor !== undefined) {
      timeline.setCursor(opts.cursor);
    }
  }, [timeline, opts?.cursor]);

  // update custom sort
  useEffect(() => {
    timeline.events.customSort = opts?.customSort;
  }, [timeline, opts?.customSort]);

  // close the old timeline when the key changes
  const oldTimeline = usePrevious(timeline);
  useEffect(() => {
    if (oldTimeline && oldTimeline !== timeline) {
      oldTimeline.close();
    }
  }, [timeline, oldTimeline]);

  // stop the loader when unmount
  useUnmount(() => {
    timeline.close();
  });

  return timeline;
}
