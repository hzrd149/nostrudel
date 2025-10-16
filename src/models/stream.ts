import { Model } from "applesauce-core";
import { getAddressPointersFromList } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import { ProfilePointer } from "nostr-tools/nip19";
import { combineLatest, filter, of, switchMap } from "rxjs";

import { STREAMER_CARDS_TYPE } from "../views/streams/components/streamer-cards";

export function StreamCardsQuery(user: ProfilePointer): Model<NostrEvent[] | undefined> {
  return (events) =>
    events.replaceable({ kind: STREAMER_CARDS_TYPE, pubkey: user.pubkey, relays: user.relays }).pipe(
      switchMap((event) => {
        if (!event) return of(undefined);

        const addresses = getAddressPointersFromList(event);
        return combineLatest(addresses.map((address) => events.replaceable(address).pipe(filter((a) => !!a))));
      }),
    );
}
