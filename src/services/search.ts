import { mapEventsToStore } from "applesauce-core";
import { onlyEvents } from "applesauce-relay";
import { Filter, NostrEvent } from "nostr-tools";
import { Observable } from "rxjs";

import { eventCache$ } from "./event-cache";
import { eventStore } from "./event-store";
import pool from "./pool";

export function createSearchAction(relays?: string[]): (filters: Filter[]) => Observable<NostrEvent> {
  return (filters: Filter[]) => {
    // search local
    if (!relays || relays.length === 0) {
      if (!eventCache$.value) throw new Error("No event cache");
      if (!eventCache$.value.search) throw new Error("Event cache does not support search");

      return eventCache$.value.search(filters).pipe(mapEventsToStore(eventStore));
    }

    // search remote
    return pool.request(relays, filters).pipe(onlyEvents(), mapEventsToStore(eventStore));
  };
}
