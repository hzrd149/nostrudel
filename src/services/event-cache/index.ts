import { Filter, NostrEvent } from "nostr-tools";
import { BehaviorSubject, bufferTime, combineLatest, EMPTY, filter, Observable, Subject, timeout } from "rxjs";

import { CAP_IS_NATIVE, CAP_IS_WEB, WASM_RELAY_SUPPORTED } from "../../env";
import { logger } from "../../helpers/debug";
import localSettings from "../preferences";
import { EventCache } from "./interface";
import { wrapInTimeout } from "../../helpers/promise";

// An ordered array of fallback types to use when event cache fails to load
const FALLBACKS: string[] = ["nostr-idb", "none"];

// Default to wasm-worker on web, native-sqlite on native
if (CAP_IS_WEB) FALLBACKS.unshift("wasm-worker");
else if (CAP_IS_NATIVE) FALLBACKS.unshift("native-sqlite");

const log = logger.extend(`event-cache`);

async function loadEventCacheModule(type: string): Promise<EventCache | null> {
  log(`Loading event cache module: ${type}`);

  if (type === "none") return null;
  else if (type === "wasm-worker" && WASM_RELAY_SUPPORTED) return await import("./wasm-worker").then((m) => m.default);
  else if (type === "native-sqlite") return await import("./native-sqlite").then((m) => m.default);
  else if (type === "nostr-idb" || type.startsWith("nostr-idb://"))
    return await import("./nostr-idb").then((m) => m.default);
  else if (type === "local-relay") return await import("./local-relay").then((m) => m.default);
  else if (type === "hosted-relay" || window.CACHE_RELAY_ENABLED)
    return await import("./hosted-relay").then((m) => m.default);

  throw new Error(`Unsupported event cache: ${type}`);
}

async function createEventCache(type: string | null): Promise<EventCache | null> {
  // Type is not set, use fallbacks
  if (type === null) {
    log("No event cache type provided, using fallbacks");
    for (const fallback of FALLBACKS) {
      try {
        return await loadEventCacheModule(fallback);
      } catch (error) {}
    }

    return null;
  }

  try {
    return await loadEventCacheModule(type);
  } catch (error) {
    log("Failed to load event cache, going to fallbacks", error);

    // Try all fallbacks
    for (const fallback of FALLBACKS) {
      try {
        return await loadEventCacheModule(fallback);
      } catch (error) {
        log("Failed to load fallback", fallback, error);
      }
    }
  }

  return null;
}

log("Initializing event cache");
export const eventCache$ = new BehaviorSubject<EventCache | null>(
  await wrapInTimeout(createEventCache(localSettings.eventCache.value), 10_000, "Opening event cache timedout").catch(
    (err) => {
      console.error(err);
      return null;
    },
  ),
);

// Update the local setting to reflect the loaded type
localSettings.eventCache.next(eventCache$.value?.type ?? "none");

// Create a new event cache instance when the type changes
localSettings.eventCache.pipe(filter((type) => type !== null && type !== eventCache$.value?.type)).subscribe((type) => {
  log(`Changing event cache to: ${type}`);

  wrapInTimeout(createEventCache(type), 10_000, "Opening event cache timedout")
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

export async function changeEventCache(type: string): Promise<void> {
  const cache = await loadEventCacheModule(type);
  eventCache$.next(cache);
  localSettings.eventCache.next(type);
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
