import { CacheRelay, openDB, pruneLastUsed } from "nostr-idb";
import { Relay } from "nostr-tools";
import { logger } from "../helpers/debug";
import _throttle from "lodash.throttle";
import { safeRelayUrl } from "../helpers/relay";

// save the local relay from query params to localStorage
const params = new URLSearchParams(location.search);
const paramRelay = params.get("localRelay");
// save the cache relay to localStorage
if (paramRelay) {
  localStorage.setItem("localRelay", paramRelay);
  params.delete("localRelay");
  if (params.size === 0) location.search = params.toString();
}

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
export const localDatabase = await openDB();

// Setup relay
function createInternalRelay() {
  return new CacheRelay(localDatabase, { maxEvents: 10000 });
}
function createRelay() {
  const localRelayURL = localStorage.getItem("localRelay");

  if (localRelayURL) {
    if (localRelayURL.startsWith("nostr-idb://")) {
      return createInternalRelay();
    } else if (safeRelayUrl(localRelayURL)) {
      return new Relay(safeRelayUrl(localRelayURL)!);
    }
  } else if (window.CACHE_RELAY_ENABLED) {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    return new Relay(new URL(protocol + location.host + "/local-relay").toString());
  }
  return createInternalRelay();
}

async function connectRelay() {
  const relay = createRelay();
  try {
    await relay.connect();
    log("Connected");
    return relay;
  } catch (e) {
    log("Failed to connect to local relay, falling back to internal");
    return createInternalRelay();
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
