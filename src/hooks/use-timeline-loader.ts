import { useEffect, useMemo } from "react";
import { usePrevious, useUnmount } from "react-use";
import { Filter } from "nostr-tools";

import timelineCacheService from "../services/timeline-cache";
import TimelineLoader, { EventFilter } from "../classes/timeline-loader";
import { useStoreQuery } from "applesauce-react";
import { Queries } from "applesauce-core";

type Options = {
  eventFilter?: EventFilter;
  useCache?: boolean;
};

export default function useTimelineLoader(
  key: string,
  relays: Iterable<string>,
  filters: Filter | Filter[] | undefined,
  opts?: Options,
) {
  const loader = useMemo(() => timelineCacheService.createTimeline(key), [key]);

  // set use cache
  if (opts?.useCache !== undefined) loader.useCache = opts?.useCache;

  // update relays
  useEffect(() => {
    loader.setRelays(relays);
    loader.triggerChunkLoad();
  }, [Array.from(relays).join("|")]);

  // update filters
  useEffect(() => {
    if (filters) {
      loader.setFilters(Array.isArray(filters) ? filters : [filters]);
      loader.open();
      loader.triggerChunkLoad();
    } else loader.close();
  }, [loader, JSON.stringify(filters)]);

  // update event filter
  useEffect(() => {
    loader.setEventFilter(opts?.eventFilter);
  }, [loader, opts?.eventFilter]);

  // close the old timeline when the key changes
  const oldTimeline = usePrevious(loader);
  useEffect(() => {
    if (oldTimeline && oldTimeline !== loader) {
      oldTimeline.close();
    }
  }, [loader, oldTimeline]);

  // stop the loader when unmount
  useUnmount(() => {
    loader.close();
  });

  let timeline = useStoreQuery(Queries.TimelineQuery, filters && [filters]) ?? [];
  if (opts?.eventFilter) timeline = timeline.filter(opts.eventFilter);

  return { loader, timeline };
}
