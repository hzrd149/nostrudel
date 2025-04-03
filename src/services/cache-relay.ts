import { BehaviorSubject, distinctUntilChanged, Observable, pairwise } from "rxjs";
import { CacheRelay, openDB } from "nostr-idb";
import { AbstractRelay } from "nostr-tools/abstract-relay";
import { fakeVerifyEvent, isFromCache, isSafeRelayURL } from "applesauce-core/helpers";
import { Filter, NostrEvent } from "nostr-tools";
import dayjs from "dayjs";

import { logger } from "../helpers/debug";
import WasmRelay from "./wasm-relay";
import MemoryRelay from "../classes/memory-relay";
import localSettings from "./local-settings";
import { eventStore } from "./event-store";

export const NOSTR_RELAY_TRAY_URL = "ws://localhost:4869/";
export async function checkNostrRelayTray() {
  return new Promise((res) => {
    const test = new AbstractRelay(NOSTR_RELAY_TRAY_URL, {
      // presume events from the cache are already verified
      verifyEvent: fakeVerifyEvent,
    });
    test
      .connect()
      .then(() => {
        test.close();
        res(true);
      })
      .catch(() => res(false));
  });
}

const log = logger.extend(`cache-relay`);

log("Creating nostr-idb database");
export const localDatabase = await openDB();

// Setup relay
function createInternalRelay() {
  return new CacheRelay(localDatabase, { maxEvents: localSettings.idbMaxEvents.value });
}

// create a cache relay instance
async function createRelay(url: string) {
  if (url) {
    if (url === ":none:") return null;

    if (url === ":memory:") {
      return new MemoryRelay();
    } else if (url === "nostr-idb://wasm-worker" && WasmRelay.SUPPORTED) {
      return new WasmRelay();
    } else if (url.startsWith("nostr-idb://")) {
      return createInternalRelay();
    } else if (isSafeRelayURL(url)) {
      return new AbstractRelay(url, { verifyEvent: fakeVerifyEvent });
    }
  } else if (window.CACHE_RELAY_ENABLED) {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    return new AbstractRelay(new URL(protocol + location.host + "/local-relay").toString(), {
      verifyEvent: fakeVerifyEvent,
    });
  }

  return createInternalRelay();
}

// create and connect to the cache relay
async function connectRelay(url: string) {
  const relay = await createRelay(url);
  if (!relay) return relay;

  try {
    await relay.connect();
    log(`Connected to ${relay.url}`);

    if (relay instanceof AbstractRelay) {
      // set the base timeout to 2 second
      relay.baseEoseTimeout = 2000;
    }

    return relay;
  } catch (e) {
    log("Failed to connect to local relay, falling back to internal", e);
    return createInternalRelay();
  }
}

export const cacheRelay$ = new BehaviorSubject<
  AbstractRelay | CacheRelay | WasmRelay | AbstractRelay | MemoryRelay | null
>(null);

// create a new cache relay instance when the url changes
localSettings.cacheRelayURL.pipe(distinctUntilChanged()).subscribe(async (url) => {
  if (cacheRelay$.value && cacheRelay$.value.url === url) return;

  const relay = await connectRelay(url);
  cacheRelay$.next(relay);
});

// keep the relay connected
cacheRelay$.subscribe((relay) => {
  if (!relay) return;

  const i = setInterval(() => {
    if (!relay.connected) relay.connect();
  }, 1000);

  return () => clearInterval(i);
});

// disconnect from old cache relays
cacheRelay$.pipe(pairwise()).subscribe(([prev, current]) => {
  if (prev) {
    log(`Disconnecting from ${prev.url}`);
    prev.close();
  }
});

// load events from cache relay
export function cacheRequest(filters: Filter[]) {
  return new Observable<NostrEvent>((observer) => {
    const relay = getCacheRelay();
    if (!relay) return observer.complete();

    const sub = relay.subscribe(filters, {
      onevent: (event) => observer.next(event),
      oneose: () => {
        sub.close();
        observer.complete();
      },
      onclose: () => observer.complete(),
    });
  });
}

/** set the cache relay URL and waits for it to connect */
export async function setCacheRelayURL(url: string) {
  return new Promise<void>((res) => {
    const sub = cacheRelay$.subscribe(() => {
      res();
      sub.unsubscribe();
    });
    localSettings.cacheRelayURL.next(url);
  });
}

export function getCacheRelay() {
  return cacheRelay$.value;
}

// every minute, prune the database
setInterval(() => {
  const relay = getCacheRelay();

  if (relay instanceof WasmRelay) {
    const days = localSettings.wasmPersistForDays.value;
    if (days) {
      log(`Removing all events older than ${days} days in WASM relay`);
      relay.worker?.delete(["REQ", "prune", { until: dayjs().subtract(days, "days").unix() }]);
    }
  }
}, 60_000);

// watch for new events and send them to the cache relay
eventStore.database.inserted.subscribe((event) => {
  const relay = getCacheRelay();
  if (relay && !isFromCache(event)) relay.publish(event);
});
