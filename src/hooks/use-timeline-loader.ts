import { useEffect, useMemo } from "react";
import { useStoreQuery } from "applesauce-react/hooks";
import { useEventStore } from "applesauce-react/hooks/use-event-store";
import { Queries } from "applesauce-core";
import { Filter, NostrEvent } from "nostr-tools";
import { useThrottle } from "react-use";
import sum from "hash-sum";

import timelineCacheService from "../services/timeline-cache";
import useForwardSubscription from "./use-forward-subscription";

type Options = {
  eventFilter?: (event: NostrEvent) => boolean;
};

export default function useTimelineLoader(
  key: string,
  relays: string[],
  filters: Filter | Filter[] | undefined,
  opts?: Options,
) {
  // start a forward subscription while component is mounted
  useForwardSubscription(relays, filters);

  const eventStore = useEventStore();
  const loader = useMemo(() => {
    if (filters) return timelineCacheService.createTimeline(key, relays, Array.isArray(filters) ? filters : [filters]);
  }, [key, sum(filters), relays.join(",")]);

  // start and stop loader
  useEffect(() => {
    const sub = loader?.subscribe((event) => eventStore.add(event));

    return () => sub?.unsubscribe();
  }, [eventStore, loader]);

  const timeline = useStoreQuery(Queries.TimelineQuery, filters && [filters]) ?? [];
  let throttled = useThrottle(timeline, 50);

  // set event filter
  if (opts?.eventFilter)
    throttled = throttled.filter((e) => {
      try {
        return opts.eventFilter && opts.eventFilter(e);
      } catch (error) {}
      return false;
    });

  return { loader, timeline: throttled };
}
