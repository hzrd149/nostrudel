import { useCallback } from "react";
import { kinds } from "nostr-tools";

import { useReadRelays } from "./use-client-relays";
import useSubject from "./use-subject";
import useTimelineLoader from "./use-timeline-loader";
import { NostrEvent, isRTag } from "../types/nostr-event";

export default function useUserRelaySets(pubkey?: string, additionalRelays?: Iterable<string>) {
  const readRelays = useReadRelays(additionalRelays);
  const eventFilter = useCallback((event: NostrEvent) => event.tags.some(isRTag), []);
  const timeline = useTimelineLoader(
    `${pubkey}-relay-sets`,
    readRelays,
    pubkey
      ? {
          authors: pubkey ? [pubkey] : [],
          kinds: [kinds.Relaysets],
        }
      : undefined,
    { eventFilter },
  );

  const lists = useSubject(timeline.timeline);
  return pubkey ? lists : [];
}
