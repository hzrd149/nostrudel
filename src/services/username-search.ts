import _throttle from "lodash.throttle";
import { getSearchNames } from "../helpers/user-metadata";
import db from "./db";
import replaceableEventLoaderService from "./replaceable-event-requester";
import userMetadataService from "./user-metadata";

const WRITE_USER_SEARCH_BATCH_TIME = 500;

const writeSearchQueue = new Set<string>();
const writeSearchData = _throttle(async () => {
  if (writeSearchQueue.size === 0) return;

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
}, WRITE_USER_SEARCH_BATCH_TIME);

replaceableEventLoaderService.events.onEvent.subscribe((event) => {
  if (event.kind === 0) {
    writeSearchQueue.add(event.pubkey);
    writeSearchData();
  }
});
