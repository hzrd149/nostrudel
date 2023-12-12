import { logger } from "../helpers/debug";
import { NostrEvent } from "../types/nostr-event";
import relayPoolService from "./relay-pool";
import _throttle from "lodash.throttle";

const enabled = !!window.CACHE_RELAY_ENABLED;
const url = new URL("/cache-relay", location.href);
url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
export const LOCAL_CACHE_RELAY = url.toString();

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
  if (!enabled) return;
  if (!wroteEvents.has(e.id)) {
    wroteEvents.add(e.id);
    writeQueue.push(e);
  }
}

if (enabled) {
  log("Enabled");
  relayPoolService.onRelayCreated.subscribe((relay) => {
    if (relay.url !== LOCAL_CACHE_RELAY) {
      relay.onEvent.subscribe((incomingEvent) => addToQueue(incomingEvent.body));
    }
  });
}

const localCacheRelayService = {
  enabled,
  addToQueue,
};

setInterval(() => {
  if (enabled) flush();
}, 1000);
setInterval(() => {
  if (enabled) report();
}, 1000 * 10);

if (import.meta.env.DEV) {
  //@ts-ignore
  window.localCacheRelayService = localCacheRelayService;
}

export default localCacheRelayService;
