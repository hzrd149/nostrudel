import { Model } from "applesauce-core";
import { Mutes } from "applesauce-core/helpers";
import { ProfilePointer } from "nostr-tools/nip19";

export function MutesQuery(user: string | ProfilePointer): Model<Mutes | undefined> {
  const pointer = typeof user === "string" ? { pubkey: user } : user;
  return (events) => events.mutes(pointer.pubkey);
}
