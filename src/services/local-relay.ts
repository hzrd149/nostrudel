import { CacheRelay, openDB, pruneLastUsed } from "nostr-idb";
import { Relay } from "nostr-tools";
import { logger } from "../helpers/debug";
import _throttle from "lodash.throttle";
import { safeRelayUrl } from "../helpers/relay";

export const NOSTR_RELAY_TRAY_URL = "ws://localhost:4869/";

export async function checkNostrRelayTray() {
  return new Promise((res) => {
    const test = new Relay(NOSTR_RELAY_TRAY_URL);
    test
      .connect()
      .then(() => {
        test.close();
        res(true);
      })
      .catch(() => res(false));
  });
}

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

/** @deprecated */
const localRelayURL = (storedCacheRelayURL && new URL(storedCacheRelayURL)) || new URL("/local-relay", location.href);
localRelayURL.protocol = localRelayURL.protocol === "https:" ? "wss:" : "ws:";

/** @deprecated */
export const LOCAL_CACHE_RELAY_ENABLED = !!window.CACHE_RELAY_ENABLED || !!localStorage.getItem("localRelay");
/** @deprecated */
export const LOCAL_CACHE_RELAY = localRelayURL.toString();

export const localDatabase = await openDB();

function createRelay() {
  const stored = localStorage.getItem("localRelay");
  if (!stored || stored.startsWith("nostr-idb://")) {
    return new CacheRelay(localDatabase, { maxEvents: 10000 });
  } else if (safeRelayUrl(stored)) {
    return new Relay(safeRelayUrl(stored)!);
  } else if (window.CACHE_RELAY_ENABLED) {
    return new Relay(new URL("/local-relay", location.href).toString());
  }

  return new CacheRelay(localDatabase, { maxEvents: 10000 });

  // if (LOCAL_CACHE_RELAY_ENABLED) {
  //   log(`Using ${LOCAL_CACHE_RELAY}`);
  //   return new Relay(LOCAL_CACHE_RELAY);
  // } else {
  //   log(`Using IndexedDB`);
  //   return new CacheRelay(localDatabase, { maxEvents: 10000 });
  // }
}

async function connectRelay() {
  const relay = createRelay();
  try {
    await relay.connect();
    log("Connected");
    return relay;
  } catch (e) {
    log("Failed to connect to local relay, falling back to internal");
    return new CacheRelay(localDatabase, { maxEvents: 10000 });
  }
}

export const localRelay = await connectRelay();

function pruneLocalDatabase() {
  if (localRelay instanceof CacheRelay) {
    pruneLastUsed(localRelay.db, 20_000);
  }
}

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
