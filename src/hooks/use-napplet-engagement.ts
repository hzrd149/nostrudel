import { mapEventsToStore } from "applesauce-core";
import { COMMENT_KIND, getZapAmount, isValidZap } from "applesauce-common/helpers";
import { getEventUID } from "applesauce-core/helpers";
import { use$ } from "applesauce-react/hooks";
import sum from "hash-sum";
import { Filter, kinds, NostrEvent } from "nostr-tools";
import { useMemo } from "react";
import { ignoreElements, NEVER } from "rxjs";

import ignoreRelayErrors from "../helpers/ignore-relay-errors";
import { eventStore } from "../services/event-store";
import pool from "../services/pool";
import useTimelineEvents from "./use-timeline-events";

export type NappletEngagement = { likes: number; comments: number; zaps: number };

// Keep tag filters small enough for relays that cap filter size
const COORDINATE_CHUNK = 100;

function getEngagementFilters(coordinates: string[]): Filter[] | undefined {
  if (coordinates.length === 0) return undefined;

  const filters: Filter[] = [];
  for (let i = 0; i < coordinates.length; i += COORDINATE_CHUNK) {
    const chunk = coordinates.slice(i, i + COORDINATE_CHUNK);
    filters.push(
      { kinds: [kinds.Reaction, kinds.Zap, COMMENT_KIND], "#a": chunk },
      { kinds: [COMMENT_KIND], "#A": chunk },
    );
  }
  return filters;
}

/** Loads reactions, comments and zaps for napplets and totals them by napplet coordinate */
export default function useNappletEngagement(napplets: NostrEvent[], relays: string[]) {
  const coordinates = useMemo(
    () => Array.from(new Set(napplets.map((event) => getEventUID(event)))).sort(),
    [napplets],
  );
  const filters = useMemo(() => getEngagementFilters(coordinates), [coordinates]);

  use$(
    () =>
      filters && relays.length > 0
        ? pool
            .request(relays, filters)
            .pipe(ignoreRelayErrors("Napplet engagement"), mapEventsToStore(eventStore), ignoreElements())
        : NEVER,
    [sum(filters), relays.join(",")],
  );

  const events = useTimelineEvents(filters);

  return useMemo(() => {
    const totals = new Map<string, NappletEngagement>();
    const wanted = new Set(coordinates);

    for (const event of events) {
      if (event.kind === kinds.Reaction && event.content === "-") continue;
      if (event.kind === kinds.Zap && !isValidZap(event)) continue;

      const targets = new Set(
        event.tags.filter((t) => (t[0] === "a" || t[0] === "A") && wanted.has(t[1])).map((t) => t[1]),
      );
      for (const coordinate of targets) {
        const stats = totals.get(coordinate) ?? { likes: 0, comments: 0, zaps: 0 };
        if (event.kind === kinds.Reaction) stats.likes++;
        else if (event.kind === COMMENT_KIND) stats.comments++;
        else stats.zaps += Math.round((getZapAmount(event) ?? 0) / 1000);
        totals.set(coordinate, stats);
      }
    }

    return totals;
  }, [events, coordinates]);
}
