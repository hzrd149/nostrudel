import { OutboxMap } from "applesauce-core/helpers";
import { TimelessFilter } from "applesauce-loaders";
import { TimelineLoader } from "applesauce-loaders/loaders";
import hash_sum from "hash-sum";
import { useEffect, useMemo, useRef } from "react";
import { merge } from "rxjs";
import timelineCacheService from "../services/timeline-cache";

export function useLoaderForOutboxes(prefix: string, outboxes: OutboxMap | undefined, kinds: number[]) {
  // Create loaders for each relay
  const loaders = useRef<TimelineLoader[]>([]);
  useEffect(() => {
    loaders.current = [];
    if (!outboxes || kinds.length === 0) return;

    for (const [relay, users] of Object.entries(outboxes)) {
      const filter: TimelessFilter = { kinds, authors: users.map((u) => u.pubkey) };

      loaders.current.push(
        timelineCacheService.createTimeline(`${prefix}-${relay}-${hash_sum(filter)}`, [relay], [filter]),
      );
    }
  }, [outboxes, prefix, kinds.join(",")]);

  // Merge all loaders
  const loader: TimelineLoader = useMemo(() => {
    return (since?: number) => merge(...loaders.current.map((l) => l(since)));
  }, []);

  return loader;
}
