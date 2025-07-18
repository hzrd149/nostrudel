import { Filter, NostrEvent } from "nostr-tools";
import { BehaviorSubject, bufferTime, combineLatest, EMPTY, filter, Observable, Subject, timeout } from "rxjs";

import { WASM_RELAY_SUPPORTED } from "../../env";
import { logger } from "../../helpers/debug";
import localSettings from "../preferences";
import { EventCache } from "./interface";
import { wrapInTimeout } from "../../helpers/promise";

const log = logger.extend(`event-cache`);

async function loadEventCacheModule(type: string): Promise<{ default: EventCache }> {
  if (type === "wasm-worker" && WASM_RELAY_SUPPORTED) return await import("./wasm-worker");
  else if (type === "nostr-idb" || type.startsWith("nostr-idb://")) return await import("./nostr-idb");
  else if (type === "local-relay") return await import("./local-relay");
  else if (type === "hosted-relay" || window.CACHE_RELAY_ENABLED) return await import("./hosted-relay");

  throw new Error(`Unsupported event cache: ${type}`);
}

async function createEventCache(type: string | null): Promise<EventCache | null> {
  if (!type || type === ":none:") return null;

  return loadEventCacheModule(type)
    .then((m) => m.default)
    .catch((err) => {
      log("Failed to load event cache module, falling back to indexeddb", err);
      return loadEventCacheModule("nostr-idb")
        .then((m) => m.default)
        .catch(() => null);
    });
}

log("Creating event cache");
export const eventCache$ = new BehaviorSubject<EventCache | null>(
  await wrapInTimeout(createEventCache(localSettings.eventCache.value), 2_000, "Opening event cache timedout").catch(
    (err) => {
      console.error(err);
      return null;
    },
  ),
);

// Create a new event cache instance when the url changes
combineLatest([localSettings.eventCache, eventCache$])
  .pipe(filter(([type, cache]) => type !== cache?.type))
  .subscribe(([url]) => {
    wrapInTimeout(createEventCache(url), 2_000, "Opening event cache timedout")
      .then((cache) => eventCache$.next(cache))
      .catch((err) => {
        log("Failed to create event cache", err);
      });
  });

if (import.meta.env.DEV) {
  eventCache$.subscribe((cache) => {
    // @ts-expect-error debug
    window.eventCache = cache;
  });
}

export async function changeEventCache(url: string | null): Promise<void> {
  const cache = await createEventCache(url);
  eventCache$.next(cache);
  localSettings.eventCache.next(url);
}

export function getEvents(filters: Filter[]): Observable<NostrEvent> {
  const cache = eventCache$.value;
  if (!cache) return EMPTY;
  return cache.read(filters).pipe(timeout({ first: 1000, with: () => EMPTY }));
}

// Buffer events and write them to the cache
const writeEvent$ = new Subject<NostrEvent>();
writeEvent$.pipe(bufferTime(1000, undefined, 500)).subscribe((events) => {
  const cache = eventCache$.value;
  if (!cache) return;
  return cache.write(events);
});

export function writeEvent(events: NostrEvent | NostrEvent[]): void {
  if (Array.isArray(events)) for (const event of events) writeEvent$.next(event);
  else writeEvent$.next(events);
}

export function clearEvents(): Promise<void> {
  const cache = eventCache$.value;
  if (!cache) return Promise.resolve();
  return cache.clear?.() ?? Promise.resolve();
}

export { getEvents as cacheRequest };
