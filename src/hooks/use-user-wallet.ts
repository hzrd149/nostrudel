import { WALLET_KIND } from "applesauce-wallet/helpers";
import useReplaceableEvent from "./use-replaceable-event";
import { useStoreQuery } from "applesauce-react/hooks";
import { WalletQuery } from "applesauce-wallet/queries";

export default function useUserWallet(pubkey?: string) {
  useReplaceableEvent(pubkey ? { kind: WALLET_KIND, pubkey } : undefined);

  return useStoreQuery(WalletQuery, pubkey ? [pubkey] : undefined);
}
