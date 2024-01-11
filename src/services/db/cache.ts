import { NostrEvent } from "../../types/nostr-event";
import { logger } from "../../helpers/debug";

const log = logger.extend("WriteCache");
const writeCache: NostrEvent[] = [];

export function addEventToCache(event: NostrEvent) {
  writeCache.push(event);
}
export function addEventsToCache(events: NostrEvent[]) {
  for (const event of events) {
    writeCache.push(event);
  }
}

async function writeChunk(size = 1000) {
  const events: NostrEvent[] = [];
  for (let i = 0; i < size; i++) {
    if (writeCache.length === 0) break;
    const e = writeCache.pop();
    if (e) events.push(e);
  }

  if (events.length > 0) {
    log(`Wrote ${events.length} to cache`);
  }
}

setInterval(writeChunk, 1000);
