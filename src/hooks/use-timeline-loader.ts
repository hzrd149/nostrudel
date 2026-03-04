import { createTimelineLoader } from "applesauce-loaders/loaders";
import { TimelineModel } from "applesauce-core/models";
import { useEventModel } from "applesauce-react/hooks";
import sum from "hash-sum";
import { Filter, NostrEvent } from "nostr-tools";
import { useMemo } from "react";

import { cacheRequest } from "../services/event-cache";
import { eventStore } from "../services/event-store";
import pool from "../services/pool";

type Options = {
  eventFilter?: (event: NostrEvent) => boolean;
};

export default function useTimelineLoader(
  key: string,
  relays: string[],
  filters: Filter | Filter[] | undefined,
  opts?: Options,
) {
  const loader = useMemo(() => {
    const filtersArray = filters && (Array.isArray(filters) ? filters : [filters]);

    if (filtersArray && filtersArray.length > 0 && relays.length > 0)
      return createTimelineLoader(pool, relays, filtersArray, {
        limit: 100,
        cache: cacheRequest,
        eventStore,
      });
    else return undefined;
  }, [key, sum(relays), sum(filters)]);

  const timeline = useEventModel(TimelineModel, filters && [filters]) ?? [];
  const filteredTimeline = useMemo(() => {
    if (!opts?.eventFilter) return timeline;
    return timeline.filter((event) => opts.eventFilter?.(event));
  }, [timeline, opts?.eventFilter]);

  return {
    loader,
    /** @deprecated get the events from the eventStore instead */
    timeline: filteredTimeline,
  };
}
