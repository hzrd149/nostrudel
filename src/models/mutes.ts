import { Model } from "applesauce-core";
import { MutedThings } from "applesauce-common/helpers";
import { HiddenMuteModel, MuteModel, PublicMuteModel } from "applesauce-common/models";
import { ProfilePointer } from "nostr-tools/nip19";

export function MutesQuery(user: string | ProfilePointer): Model<MutedThings | undefined> {
  const pointer = typeof user === "string" ? { pubkey: user } : user;
  return (events) => events.model(MuteModel, pointer.pubkey);
}

/** The public (unencrypted) half of a user's mute list only. */
export function PublicMutesQuery(user: string | ProfilePointer): Model<MutedThings | undefined> {
  const pointer = typeof user === "string" ? { pubkey: user } : user;
  return (events) => events.model(PublicMuteModel, pointer.pubkey);
}

/**
 * The hidden (encrypted) half of a user's mute list only. Resolves nullish while the hidden half
 * is locked or absent — that nullish value is the signal that content is locked, so callers must
 * not narrow it away.
 */
export function HiddenMutesQuery(user: string | ProfilePointer): Model<MutedThings | null | undefined> {
  const pointer = typeof user === "string" ? { pubkey: user } : user;
  return (events) => events.model(HiddenMuteModel, pointer.pubkey);
}
