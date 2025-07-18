import { markFromCache } from "applesauce-core/helpers";
import { addEvents, clearDB, getEventsForFilters, IndexCache, openDB, pruneLastUsed } from "nostr-idb";
import { NostrEvent } from "nostr-tools";
import { from, mergeMap, tap } from "rxjs";

import localSettings from "../preferences";
import { EventCache } from "./interface";

export const indexes = new IndexCache();
export const database = await openDB();

export async function saveEvents(events: NostrEvent[]) {
  await addEvents(database, events);
}

const indexeddbCache: EventCache = {
  type: "nostr-idb",
  read: (filters) =>
    from(getEventsForFilters(database, filters, indexes)).pipe(
      mergeMap((events) => from(events)),
      tap((e) => markFromCache(e)),
    ),
  write(events) {
    for (let event of events) indexes.addEventToIndexes(event);
    return addEvents(database, events);
  },
  async clear() {
    await clearDB(database);
  },
};

// Prune the database on startup
await pruneLastUsed(database, localSettings.idbMaxEvents.value);

export default indexeddbCache;
