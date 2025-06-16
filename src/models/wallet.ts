import { Model } from "applesauce-core";
import { getHistoryRedeemed, WALLET_KIND } from "applesauce-wallet/helpers";
import { WalletInfo, WalletModel } from "applesauce-wallet/models";
import { ProfilePointer } from "nostr-tools/nip19";
import { combineLatest, ignoreElements, map, mergeWith } from "rxjs";

import { NostrEvent } from "nostr-social-graph";
import { ReplaceableQuery } from "./addressable";
import EventQuery from "./events";

export function WalletQuery(user: string | ProfilePointer): Model<WalletInfo | undefined> {
  const pointer = typeof user === "string" ? { pubkey: user } : user;
  return (events) =>
    events
      .model(ReplaceableQuery, WALLET_KIND, pointer.pubkey, undefined, pointer.relays)
      .pipe(ignoreElements(), mergeWith(events.model(WalletModel, pointer.pubkey)));
}

export function WalletHistoryRedeemedQuery(history: NostrEvent): Model<NostrEvent[]> {
  return (events) =>
    combineLatest(getHistoryRedeemed(history).map((id) => events.model(EventQuery, { id }))).pipe(
      map((events) => events.filter((e) => !!e)),
    );
}
