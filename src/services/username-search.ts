import _throttle from "lodash.throttle";
import { kinds } from "nostr-tools";
import { from } from "rxjs";
import { filter, bufferTime, concatMap, mergeWith, shareReplay, map, scan } from "rxjs/operators";
import { getProfileContent, isFromCache } from "applesauce-core/helpers";

import { getSearchNames } from "../helpers/nostr/profile";
import db from "./database";
import { eventStore } from "./event-store";
import { logger } from "../helpers/debug";

export type UserDirectory = Record<string, string[]>;
export type SearchDirectory = { pubkey: string; names: string[] }[];

const log = logger.extend("UsernameSearch");

log(`Started loading profiles`);
const cache = db.getAll("userSearch").then((rows: { pubkey: string; names: string[] }[]) => {
  log(`Loaded ${rows.length} profiles`);
  return rows.reduce<UserDirectory>((dir, row) => ({ ...dir, [row.pubkey]: row.names }), {});
});

const updates = eventStore.filters([{ kinds: [kinds.Metadata] }]).pipe(
  filter((event) => !isFromCache(event)),
  bufferTime(500),
  concatMap(async (events) => {
    if (events.length === 0) return {};

    const updates: UserDirectory = {};
    const transaction = db.transaction("userSearch", "readwrite");
    for (const metadata of events) {
      const profile = getProfileContent(metadata);
      const names = getSearchNames(profile);
      updates[metadata.pubkey] = names;
      transaction.objectStore("userSearch").put({ pubkey: metadata.pubkey, names });
    }
    transaction.commit();
    await transaction.done;
    log(`Updated ${events.length} profiles`);
    return updates;
  }),
);

export const userSearchDirectory = from(cache).pipe(
  mergeWith(updates),
  scan((dir, updates) => ({ ...dir, ...updates })),
  map<UserDirectory, SearchDirectory>((dir) => Object.entries(dir).map(([pubkey, names]) => ({ pubkey, names }))),
  shareReplay(1),
);
