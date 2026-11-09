import { watchEventUpdates } from "applesauce-core";
import { getEncryptedContent } from "applesauce-core/helpers";
import { useEventStore, use$ } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { filter, map, of } from "rxjs";
import useMessaging from "./use-messaging";
import useAsyncAction from "./use-async-action";

export function useLegacyMessagePlaintext(event: NostrEvent) {
  const eventStore = useEventStore();
  const session = useMessaging();
  const state = use$(() => session?.legacy.decryptionState$, [session]);
  const error = state?.errors.get(event.id);
  const plaintext = use$(
    () =>
      of(event)
        .pipe(watchEventUpdates(eventStore))
        .pipe(
          filter((e) => !!e),
          map((event) => getEncryptedContent(event)),
        ),
    [event.id, eventStore],
  );

  const unlock = useAsyncAction(async () => {
    if (!session) throw new Error("Messaging is not ready");
    await session.legacy.retryDecryption(event);
  }, [event, session]);

  return { error: error instanceof Error ? error : undefined, plaintext, unlock: unlock.run };
}
