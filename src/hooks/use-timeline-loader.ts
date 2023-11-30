import { useEffect, useMemo } from "react";
import { useUnmount } from "react-use";

import { NostrRequestFilter } from "../types/nostr-query";
import timelineCacheService from "../services/timeline-cache";
import { EventFilter } from "../classes/timeline-loader";
import { NostrEvent } from "../types/nostr-event";
import { createSimpleQueryMap } from "../helpers/nostr/filter";

type Options = {
  /** @deprecated */
  enabled?: boolean;
  eventFilter?: EventFilter;
  cursor?: number;
  customSort?: (a: NostrEvent, b: NostrEvent) => number;
};

export default function useTimelineLoader(
  key: string,
  relays: string[],
  query: NostrRequestFilter | undefined,
  opts?: Options,
) {
  const timeline = useMemo(() => timelineCacheService.createTimeline(key), [key]);

  useEffect(() => {
    if (query) {
      timeline.setQueryMap(createSimpleQueryMap(relays, query));
      timeline.open();
    } else timeline.close();
  }, [timeline, JSON.stringify(query), relays.join("|")]);

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
