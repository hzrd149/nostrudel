import { Model } from "applesauce-core";
import { kinds } from "nostr-tools";
import { ProfilePointer } from "nostr-tools/nip19";
import { ignoreElements, mergeWith } from "rxjs";

import { AddressableQuery } from "./addressable";

/** A model that loads a users profile */
export function MailboxesQuery(
  pubkey: string | ProfilePointer,
): Model<{ inboxes: string[]; outboxes: string[] } | undefined> {
  const pointer = typeof pubkey === "string" ? { pubkey } : pubkey;
  return (events) =>
    events
      .model(AddressableQuery, { kind: kinds.RelayList, pubkey: pointer.pubkey, relays: pointer.relays })
      .pipe(ignoreElements(), mergeWith(events.mailboxes(pointer.pubkey)));
}
