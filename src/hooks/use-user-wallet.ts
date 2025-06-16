import { useEventModel } from "applesauce-react/hooks";
import { WalletQuery } from "../models/wallet";
import { ProfilePointer } from "nostr-tools/nip19";

export default function useUserWallet(user?: string | ProfilePointer) {
  return useEventModel(WalletQuery, user ? [user] : undefined);
}
