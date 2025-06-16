import { Model } from "applesauce-core";
import { Mutes } from "applesauce-core/helpers";
import { kinds } from "nostr-tools";
import { ProfilePointer } from "nostr-tools/nip19";
import { ignoreElements, mergeWith } from "rxjs";
import { ReplaceableQuery } from "./addressable";

export function MutesQuery(user: string | ProfilePointer): Model<Mutes | undefined> {
  const pointer = typeof user === "string" ? { pubkey: user } : user;
  return (events) =>
    events
      .model(ReplaceableQuery, kinds.Mutelist, pointer.pubkey, undefined, pointer.relays)
      .pipe(ignoreElements(), mergeWith(events.mutes(pointer.pubkey)));
}
