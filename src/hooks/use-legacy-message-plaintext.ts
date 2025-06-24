import { watchEventUpdates } from "applesauce-core";
import { getEncryptedContent, unlockLegacyMessage } from "applesauce-core/helpers";
import { useActiveAccount, useEventStore, useObservableEagerMemo } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useCallback, useState } from "react";
import { filter, map, of } from "rxjs";

export function useLegacyMessagePlaintext(event: NostrEvent) {
  const eventStore = useEventStore();
  const account = useActiveAccount()!;

  const [error, setError] = useState<Error>();
  const plaintext = useObservableEagerMemo(
    () =>
      of(event)
        .pipe(watchEventUpdates(eventStore))
        .pipe(
          filter((e) => !!e),
          map((event) => getEncryptedContent(event)),
        ),
    [event.id, eventStore],
  );

  const unlock = useCallback(async () => {
    try {
      setError(undefined);
      await unlockLegacyMessage(event, account.pubkey, account);
    } catch (error) {
      setError(error as Error);
    }
  }, [event, account]);

  return { error, plaintext, unlock };
}
