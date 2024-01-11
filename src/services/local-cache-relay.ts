import { CacheRelay, openDB } from "nostr-idb";
import { Relay } from "nostr-tools";
import { logger } from "../helpers/debug";
import { NostrEvent } from "../types/nostr-event";
import relayPoolService from "./relay-pool";
import _throttle from "lodash.throttle";

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

export const CACHE_RELAY_ENABLED = !!window.CACHE_RELAY_ENABLED || !!localStorage.getItem("cacheRelay");
export const LOCAL_CACHE_RELAY = url.toString();

export const localCacheDatabase = await openDB();
export const localCacheRelay = CACHE_RELAY_ENABLED ? new Relay(LOCAL_CACHE_RELAY) : new CacheRelay(localCacheDatabase);

await localCacheRelay.connect();

setInterval(() => {
  if (!localCacheRelay.connected) localCacheRelay.connect();
}, 1000 * 5);

const wroteEvents = new Set<string>();
const writeQueue: NostrEvent[] = [];

const BATCH_WRITE = 100;

const log = logger.extend(`LocalCacheRelay`);
async function flush() {
  for (let i = 0; i < BATCH_WRITE; i++) {
    const e = writeQueue.pop();
    if (!e) continue;
    relayPoolService.requestRelay(LOCAL_CACHE_RELAY).send(["EVENT", e]);
  }
}
function report() {
  if (writeQueue.length) {
    log(`${writeQueue.length} events in write queue`);
  }
}

function addToQueue(e: NostrEvent) {
  if (!CACHE_RELAY_ENABLED) return;
  if (!wroteEvents.has(e.id)) {
    wroteEvents.add(e.id);
    writeQueue.push(e);
  }
}

if (CACHE_RELAY_ENABLED) {
  log("Enabled");
  relayPoolService.onRelayCreated.subscribe((relay) => {
    if (relay.url !== LOCAL_CACHE_RELAY) {
      relay.onEvent.subscribe((incomingEvent) => addToQueue(incomingEvent.body));
    }
  });
}

const localCacheRelayService = {
  enabled: CACHE_RELAY_ENABLED,
  addToQueue,
};

setInterval(() => {
  if (CACHE_RELAY_ENABLED) flush();
}, 1000);
setInterval(() => {
  if (CACHE_RELAY_ENABLED) report();
}, 1000 * 10);

if (import.meta.env.DEV) {
  //@ts-ignore
  window.localCacheRelayService = localCacheRelayService;
}

export default localCacheRelayService;
