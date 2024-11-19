import { getTagValue } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";

export function getWalletName(wallet: NostrEvent) {
  return getTagValue(wallet, "name");
}

export function getWalletDescription(wallet: NostrEvent) {
  return getTagValue(wallet, "description");
}
