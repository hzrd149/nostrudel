import { Model } from "applesauce-core";
import { getHistoryRedeemed, WALLET_KIND } from "applesauce-wallet/helpers";
import { WalletInfo, WalletModel } from "applesauce-wallet/models";
import { NostrEvent } from "nostr-tools";
import { ProfilePointer } from "nostr-tools/nip19";
import { combineLatest, ignoreElements, map, mergeWith } from "rxjs";

export function WalletQuery(user: string | ProfilePointer): Model<WalletInfo | undefined> {
  const pointer = typeof user === "string" ? { pubkey: user } : user;
  return (events) =>
    events
      .replaceable({ kind: WALLET_KIND, pubkey: pointer.pubkey, relays: pointer.relays })
      .pipe(ignoreElements(), mergeWith(events.model(WalletModel, pointer.pubkey)));
}

export function WalletHistoryRedeemedQuery(history: NostrEvent): Model<NostrEvent[]> {
  return (events) =>
    combineLatest(getHistoryRedeemed(history).map((id) => events.event(id))).pipe(
      map((events) => events.filter((e) => !!e)),
    );
}
