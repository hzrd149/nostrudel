import _throttle from "lodash.throttle";
import { kinds } from "nostr-tools";
import { from } from "rxjs";
import { filter, bufferTime, concatMap, mergeWith, reduce, shareReplay, map } from "rxjs/operators";
import { getProfileContent, isFromCache } from "applesauce-core/helpers";

import { getSearchNames } from "../helpers/nostr/user-metadata";
import db from "./db";
import { eventStore } from "./event-store";

export type UserDirectory = Record<string, string[]>;
export type SearchDirectory = { pubkey: string; names: string[] }[];

const cached = from(db.getAll("userSearch") as Promise<{ pubkey: string; names: string[] }[]>);
const updates = eventStore.stream([{ kinds: [kinds.Metadata] }]).pipe(
  filter((event) => !isFromCache(event)),
  bufferTime(500),
  concatMap(async (events) => {
    if (events.length === 0) return {};

    const updates: UserDirectory = {};
    const transaction = db.transaction("userSearch", "readwrite");
    for (let metadata of events) {
      const profile = getProfileContent(metadata);
      const names = getSearchNames(profile);
      updates[metadata.pubkey] = names;
      transaction.objectStore("userSearch").put({ pubkey: metadata.pubkey, names });
    }
    transaction.commit();
    await transaction.done;
    return updates;
  }),
);

export const userSearchDirectory = cached.pipe(
  map((rows) => rows.reduce<UserDirectory>((dir, row) => ({ ...dir, [row.pubkey]: row.names }), {})),
  mergeWith(updates),
  reduce((dir, updates) => ({ ...dir, ...updates })),
  map<UserDirectory, SearchDirectory>((dir) => Object.entries(dir).map(([pubkey, names]) => ({ pubkey, names }))),
  shareReplay(1),
);
