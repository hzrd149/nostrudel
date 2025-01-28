import { useCallback, useMemo } from "react";
import { NostrEvent } from "nostr-tools";
import { useActiveAccount, useObservable } from "applesauce-react/hooks";

import decryptionCacheService from "../services/decryption-cache";
import { getDMRecipient, getDMSender } from "../helpers/nostr/dms";

export function useKind4Decrypt(event: NostrEvent, pubkey?: string) {
  const account = useActiveAccount()!;

  pubkey = pubkey || event.pubkey === account.pubkey ? getDMRecipient(event) : getDMSender(event);

  const container = useMemo(
    () => decryptionCacheService.getOrCreateContainer(event.id, "nip04", pubkey, event.content),
    [event, pubkey],
  );

  const plaintext = useObservable(container.plaintext);
  const error = useObservable(container.error);

  const requestDecrypt = useCallback(() => {
    const p = decryptionCacheService.requestDecrypt(container);
    decryptionCacheService.startDecryptionQueue();
    return p;
  }, [container]);

  return { container, error, plaintext, requestDecrypt };
}
