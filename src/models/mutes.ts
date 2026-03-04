import { Model } from "applesauce-core";
import { MutedThings } from "applesauce-common/helpers";
import { MuteModel } from "applesauce-common/models";
import { ProfilePointer } from "nostr-tools/nip19";

export function MutesQuery(user: string | ProfilePointer): Model<MutedThings | undefined> {
  const pointer = typeof user === "string" ? { pubkey: user } : user;
  return (events) => events.model(MuteModel, pointer.pubkey);
}
