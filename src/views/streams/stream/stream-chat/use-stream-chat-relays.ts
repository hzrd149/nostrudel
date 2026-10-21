import { castEvent, Stream } from "applesauce-common/casts";
import { relaySet } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import { useMemo } from "react";

import { useUserInbox } from "../../../../hooks/use-user-mailboxes";
import { eventStore } from "../../../../services/event-store";

/**
 * Derives the set of relays to subscribe/publish chat on for a stream.
 *
 * Combines:
 * - Host NIP-65 inboxes (where the host reads messages)
 * - The stream event's `relays` tag (if any)
 * - Platform inboxes (the stream-event author, when different from the host —
 *   e.g. zap.stream hosting a stream on behalf of a user)
 */
export default function useStreamChatRelays(stream: NostrEvent): string[] {
  const cast = castEvent(stream, Stream, eventStore);
  const host = cast.host.pubkey;
  const platform = stream.pubkey;
  const hostInboxes = useUserInbox(host);
  const platformInboxes = useUserInbox(platform !== host ? platform : undefined);
  const streamRelays = cast.relays;

  return useMemo(
    () => relaySet(hostInboxes, streamRelays, platformInboxes),
    [hostInboxes, streamRelays, platformInboxes],
  );
}
