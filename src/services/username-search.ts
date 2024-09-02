import _throttle from "lodash.throttle";
import { getSearchNames } from "../helpers/nostr/user-metadata";
import db from "./db";
import replaceableEventsService from "./replaceable-events";
import userMetadataService from "./user-metadata";
import { logger } from "../helpers/debug";
import Subject from "../classes/subject";

const WRITE_USER_SEARCH_BATCH_TIME = 500;
const log = logger.extend("UsernameSearch");

export const userSearchUpdate = new Subject();

const writeSearchQueue = new Set<string>();
const writeSearchData = _throttle(async () => {
  if (writeSearchQueue.size === 0) return;

  log(`Writing ${writeSearchQueue.size} to search table`);
  const keys = Array.from(writeSearchQueue);
  writeSearchQueue.clear();

  const transaction = db.transaction("userSearch", "readwrite");
  for (const pubkey of keys) {
    const metadata = userMetadataService.getSubject(pubkey).value;
    if (metadata) {
      const names = getSearchNames(metadata);
      transaction.objectStore("userSearch").put({ pubkey, names });
    }
  }
  transaction.commit();
  await transaction.done;
  userSearchUpdate.next(Math.random());
}, WRITE_USER_SEARCH_BATCH_TIME);

replaceableEventsService.events.onEvent.subscribe((event) => {
  if (event.kind === 0) {
    writeSearchQueue.add(event.pubkey);
    writeSearchData();
  }
});
