import { CacheRelay, openDB } from "nostr-idb";
import { AbstractRelay, NostrEvent, VerifiedEvent, verifiedSymbol } from "nostr-tools";
import { logger } from "../helpers/debug";
import { safeRelayUrl } from "../helpers/relay";
import WasmRelay from "./wasm-relay";
import MemoryRelay from "../classes/memory-relay";

function fakeVerify(event: NostrEvent): event is VerifiedEvent {
  return (event[verifiedSymbol] = true);
}

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
    const test = new AbstractRelay(NOSTR_RELAY_TRAY_URL, { verifyEvent: fakeVerify });
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
async function createRelay() {
  const localRelayURL = localStorage.getItem("localRelay");

  if (localRelayURL) {
    if (localRelayURL === ":none:") {
      return null;
    }
    if (localRelayURL === ":memory:") {
      return new MemoryRelay();
    } else if (localRelayURL === "nostr-idb://wasm-worker" && WasmRelay.SUPPORTED) {
      return new WasmRelay();
    } else if (localRelayURL.startsWith("nostr-idb://")) {
      return createInternalRelay();
    } else if (safeRelayUrl(localRelayURL)) {
      return new AbstractRelay(safeRelayUrl(localRelayURL)!, { verifyEvent: fakeVerify });
    }
  } else if (window.satellite) {
    return new AbstractRelay(await window.satellite.getLocalRelay(), { verifyEvent: fakeVerify });
  } else if (window.CACHE_RELAY_ENABLED) {
    const protocol = location.protocol === "https:" ? "wss:" : "ws:";
    return new AbstractRelay(new URL(protocol + location.host + "/local-relay").toString(), {
      verifyEvent: fakeVerify,
    });
  }
  return createInternalRelay();
}

async function connectRelay() {
  const relay = await createRelay();
  if (!relay) return relay;

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

// keep the relay connection alive
setInterval(() => {
  if (localRelay && !localRelay.connected) localRelay.connect().then(() => log("Reconnected"));
}, 1000 * 5);

if (import.meta.env.DEV) {
  //@ts-ignore
  window.localDatabase = localDatabase;
  //@ts-ignore
  window.localRelay = localRelay;
}
