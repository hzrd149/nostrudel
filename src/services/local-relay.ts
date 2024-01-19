import { CacheRelay, openDB, pruneLastUsed } from "nostr-idb";
import { Relay } from "nostr-tools";
import { logger } from "../helpers/debug";
import _throttle from "lodash.throttle";

const log = logger.extend(`LocalRelay`);
const params = new URLSearchParams(location.search);

const paramRelay = params.get("localRelay");
// save the cache relay to localStorage
if (paramRelay) {
  localStorage.setItem("localRelay", paramRelay);
  params.delete("localRelay");
  if (params.size === 0) location.search = params.toString();
}

const storedCacheRelayURL = localStorage.getItem("localRelay");
const url = (storedCacheRelayURL && new URL(storedCacheRelayURL)) || new URL("/local-relay", location.href);
url.protocol = url.protocol === "https:" ? "wss:" : "ws:";

export const LOCAL_CACHE_RELAY_ENABLED = !!window.CACHE_RELAY_ENABLED || !!localStorage.getItem("localRelay");
export const LOCAL_CACHE_RELAY = url.toString();

export const localDatabase = await openDB();

function createRelay() {
  if (LOCAL_CACHE_RELAY_ENABLED) {
    log(`Using ${LOCAL_CACHE_RELAY}`);
    return new Relay(LOCAL_CACHE_RELAY);
  } else {
    log(`Using IndexedDB`);
    return new CacheRelay(localDatabase, { maxEvents: 10000 });
  }
}

export const localRelay = createRelay();

function pruneLocalDatabase() {
  if (localRelay instanceof CacheRelay) {
    pruneLastUsed(localRelay.db, 20_000);
  }
}
// connect without waiting
localRelay.connect().then(() => {
  log("Connected");

  pruneLocalDatabase();
});

// keep the relay connection alive
setInterval(() => {
  if (!localRelay.connected) localRelay.connect().then(() => log("Reconnected"));
}, 1000 * 5);

setInterval(() => {
  pruneLocalDatabase();
}, 1000 * 60);

if (import.meta.env.DEV) {
  //@ts-ignore
  window.localDatabase = localDatabase;
  //@ts-ignore
  window.localRelay = localRelay;
}
