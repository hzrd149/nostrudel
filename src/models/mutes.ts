import { Model } from "applesauce-core";
import { getMutedThings, MutedThings } from "applesauce-common/helpers";
import { ProfilePointer } from "nostr-tools/nip19";
import { kinds } from "nostr-tools";
import { map } from "rxjs";

// v5: Use MutedThings instead of Mutes, and use replaceable() instead of mutes() method
export function MutesQuery(user: string | ProfilePointer): Model<MutedThings | undefined> {
  const pointer = typeof user === "string" ? { pubkey: user } : user;
  return (events) =>
    events
      .replaceable({ kind: kinds.Mutelist, pubkey: pointer.pubkey })
      .pipe(map((event) => (event ? getMutedThings(event) : undefined)));
}
