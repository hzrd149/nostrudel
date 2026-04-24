import { relaySet } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import { useMemo } from "react";

import { getStreamHost, getStreamRelays } from "../../../../helpers/nostr/stream";
import { useUserInbox } from "../../../../hooks/use-user-mailboxes";

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
  const host = getStreamHost(stream);
  const platform = stream.pubkey;
  const hostInboxes = useUserInbox(host);
  const platformInboxes = useUserInbox(platform !== host ? platform : undefined);
  const streamRelays = getStreamRelays(stream);

  return useMemo(
    () => relaySet(hostInboxes, streamRelays, platformInboxes),
    [hostInboxes, streamRelays, platformInboxes],
  );
}
