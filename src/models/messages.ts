import { Model } from "applesauce-core";
import { getConversationParticipants, isSafeRelayURL, normalizeURL, processTags } from "applesauce-core/helpers";
import { kinds } from "nostr-tools";
import { ProfilePointer } from "nostr-tools/nip19";
import { combineLatest, map } from "rxjs";

import { AddressableQuery } from "./addressable";
import { MailboxesQuery } from "./mailboxes";

/** A model that loads the relays that a user has used to send direct messages */
export function DirectMessageRelays(pubkey: string | ProfilePointer): Model<string[] | undefined> {
  const pointer = typeof pubkey === "string" ? { pubkey } : pubkey;

  return (events) =>
    events.model(AddressableQuery, { kind: kinds.DirectMessageRelaysList, ...pointer }).pipe(
      map((e) => {
        if (!e) return undefined;

        return processTags(e.tags, (t) =>
          t[0] === "relay" && t[1] && isSafeRelayURL(t[1]) ? normalizeURL(t[1]) : undefined,
        );
      }),
    );
}

/** A model that loads the direct message inboxes of all participants in a group */
export function GroupMessageInboxes(group: string, cache?: boolean): Model<Record<string, string[] | undefined>> {
  const pubkeys = getConversationParticipants(group);

  return (events) =>
    combineLatest(
      Object.fromEntries(
        pubkeys.map((pubkey) => {
          const inboxes = events.model(MailboxesQuery, { pubkey, cache }).pipe(map((m) => m?.inboxes));
          const relays = events.model(DirectMessageRelays, { pubkey, cache });

          return [pubkey, combineLatest([inboxes, relays]).pipe(map(([inboxes, relays]) => relays || inboxes))];
        }),
      ),
    );
}
