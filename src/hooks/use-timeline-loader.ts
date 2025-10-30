import { TimelineModel } from "applesauce-core/models";
import { useEventModel } from "applesauce-react/hooks";
import sum from "hash-sum";
import { Filter, NostrEvent } from "nostr-tools";
import { useMemo } from "react";
import { useThrottle } from "react-use";

import timelineCacheService from "../services/timeline-cache";
import useSimpleSubscription from "./use-forward-subscription";

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
  useSimpleSubscription(relays, filters);

  const loader = useMemo(() => {
    const filtersArray = filters && (Array.isArray(filters) ? filters : [filters]);

    if (filtersArray && filtersArray.length > 0 && relays.length > 0)
      return timelineCacheService.createTimeline(key, relays, Array.isArray(filters) ? filters : [filters]);
    else return undefined;
  }, [key, sum(filters), relays.join(",")]);

  const timeline = useEventModel(TimelineModel, filters && [filters]) ?? [];
  let throttled = useThrottle(timeline, 50);

  // set event filter
  if (opts?.eventFilter)
    throttled = throttled.filter((e) => {
      try {
        return opts.eventFilter && opts.eventFilter(e);
      } catch (error) {}
      return false;
    });

  return {
    loader,
    /** @deprecated get the events from the eventStore instead */
    timeline: throttled,
  };
}
