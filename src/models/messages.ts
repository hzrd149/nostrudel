import { Model } from "applesauce-core";
import { isSafeRelayURL, normalizeURL, processTags } from "applesauce-core/helpers";
import { kinds } from "nostr-tools";
import { ProfilePointer } from "nostr-tools/nip19";
import { map } from "rxjs";

import { AddressableQuery } from "./addressable";

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
