import { Model } from "applesauce-core";
import { getHistoryRedeemed, WALLET_KIND } from "applesauce-wallet/helpers";
import { NostrEvent } from "nostr-tools";
import { ProfilePointer } from "nostr-tools/nip19";
import { combineLatest, map, startWith } from "rxjs";

export function WalletQuery(user: string | ProfilePointer): Model<NostrEvent | undefined> {
  const pointer = typeof user === "string" ? { pubkey: user } : user;
  return (events) => events.replaceable({ kind: WALLET_KIND, pubkey: pointer.pubkey, relays: pointer.relays });
}

export function WalletHistoryRedeemedQuery(history: NostrEvent): Model<NostrEvent[]> {
  return (events) =>
    combineLatest(getHistoryRedeemed(history).map((id) => events.event(id))).pipe(
      map((events) => events.filter((e) => !!e)),
      startWith([]),
    );
}
