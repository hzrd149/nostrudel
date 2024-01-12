import { CacheRelay, openDB } from "nostr-idb";
import { Relay } from "nostr-tools";
import { logger } from "../helpers/debug";
import _throttle from "lodash.throttle";

const log = logger.extend(`LocalCacheRelay`);
const params = new URLSearchParams(location.search);

const paramRelay = params.get("cacheRelay");
// save the cache relay to localStorage
if (paramRelay) {
  localStorage.setItem("cacheRelay", paramRelay);
  params.delete("cacheRelay");
  if (params.size === 0) location.search = params.toString();
}

const storedCacheRelayURL = localStorage.getItem("cacheRelay");
const url = (storedCacheRelayURL && new URL(storedCacheRelayURL)) || new URL("/cache-relay", location.href);
url.protocol = url.protocol === "https:" ? "wss:" : "ws:";

export const LOCAL_CACHE_RELAY_ENABLED = !!window.CACHE_RELAY_ENABLED || !!localStorage.getItem("cacheRelay");
export const LOCAL_CACHE_RELAY = url.toString();

export const localCacheDatabase = await openDB();

function createRelay() {
  if (LOCAL_CACHE_RELAY_ENABLED) {
    log(`Using ${LOCAL_CACHE_RELAY}`);
    return new Relay(LOCAL_CACHE_RELAY);
  } else {
    log(`Using IndexedDB`);
    return new CacheRelay(localCacheDatabase);
  }
}

export const localCacheRelay = createRelay();

// connect without waiting
localCacheRelay.connect().then(() => {
  log("Connected");
});

// keep the relay connection alive
setInterval(() => {
  if (!localCacheRelay.connected) localCacheRelay.connect().then(() => log("Reconnected"));
}, 1000 * 5);

if (import.meta.env.DEV) {
  //@ts-ignore
  window.localCacheRelay = localCacheRelay;
}
