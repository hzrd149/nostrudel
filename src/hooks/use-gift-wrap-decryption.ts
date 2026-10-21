import { use$, useActiveAccount } from "applesauce-react/hooks";

import {
  failedGiftWraps$,
  giftWrapDecryptionRunning$,
  giftWrapsDecrypted$,
  lockedGiftWraps,
  retryFailedGiftWraps,
  startGiftWrapDecryption,
  stopGiftWrapDecryption,
} from "../services/gift-wrap-decryption";

/** Gets the active account's locked gift wraps and controls the shared decryption queue */
export default function useGiftWrapDecryption() {
  const account = useActiveAccount();
  const locked = use$(() => (account ? lockedGiftWraps(account.pubkey) : undefined), [account?.pubkey]);
  const failed = use$(failedGiftWraps$);
  const running = use$(giftWrapDecryptionRunning$);
  const decrypted = use$(giftWrapsDecrypted$);

  return {
    locked,
    failed,
    running,
    decrypted,
    start: startGiftWrapDecryption,
    stop: stopGiftWrapDecryption,
    retryFailed: retryFailedGiftWraps,
  };
}
