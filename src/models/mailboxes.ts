import { Model } from "applesauce-core";
import { ProfilePointer } from "nostr-tools/nip19";
import { ignoreElements, mergeWith } from "rxjs";
import { kinds } from "nostr-tools";

import { ReplaceableQuery } from "./addressable";

/** A model that loads a users profile */
export function MailboxesQuery(
  pubkey: string | ProfilePointer,
): Model<{ inboxes: string[]; outboxes: string[] } | undefined> {
  const pointer = typeof pubkey === "string" ? { pubkey } : pubkey;
  return (events) =>
    events
      .model(ReplaceableQuery, kinds.RelayList, pointer.pubkey, undefined, pointer.relays)
      .pipe(ignoreElements(), mergeWith(events.mailboxes(pointer.pubkey)));
}
