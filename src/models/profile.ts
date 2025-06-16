import { Model } from "applesauce-core";
import { ProfileContent } from "applesauce-core/helpers";
import { kinds } from "nostr-tools";
import { ProfilePointer } from "nostr-tools/nip19";
import { combineLatest, EMPTY, ignoreElements, mergeWith, defer } from "rxjs";

import { profileLoader } from "../services/loaders";

/** A model that loads a users profile */
export function ProfileQuery(pubkey: string | ProfilePointer): Model<ProfileContent | undefined> {
  const pointer = typeof pubkey === "string" ? { pubkey } : pubkey;
  return (events) =>
    defer(() =>
      events.hasReplaceable(kinds.Metadata, pointer.pubkey)
        ? EMPTY
        : profileLoader({ kind: kinds.Metadata, pubkey: pointer.pubkey, relays: pointer.relays }),
    ).pipe(ignoreElements(), mergeWith(events.profile(pointer.pubkey)));
}

/** A model that loads a record ofusers profiles */
export function UserProfilesQuery(pubkeys: string[]): Model<Record<string, ProfileContent | undefined>> {
  return (events) => {
    const profiles = Object.fromEntries(pubkeys.map((pubkey) => [pubkey, events.model(ProfileQuery, pubkey)]));
    return combineLatest(profiles);
  };
}
