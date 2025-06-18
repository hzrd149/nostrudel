import { Model } from "applesauce-core";
import { ProfilePointer } from "nostr-tools/nip19";
import { ignoreElements, mergeWith } from "rxjs";
import { AddressableQuery } from "./addressable";

export function ContactsQuery(pubkey: string | ProfilePointer): Model<ProfilePointer[]> {
  const pointer = typeof pubkey === "string" ? { pubkey } : pubkey;
  return (events) =>
    events
      .model(AddressableQuery, { kind: 3, pubkey: pointer.pubkey })
      .pipe(ignoreElements(), mergeWith(events.contacts(pointer.pubkey)));
}
