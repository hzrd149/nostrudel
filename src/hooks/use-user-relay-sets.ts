import { isRTag } from "applesauce-core/helpers";
import { kinds, NostrEvent } from "nostr-tools";
import { useCallback } from "react";

import { truncateId } from "../helpers/string";
import { useReadRelays } from "./use-client-relays";
import useTimelineLoader from "./use-timeline-loader";

export default function useUserRelaySets(pubkey?: string, additionalRelays?: Iterable<string>) {
  const readRelays = useReadRelays(additionalRelays);
  const eventFilter = useCallback((event: NostrEvent) => event.tags.some(isRTag), []);

  const filters = pubkey
    ? {
        authors: [pubkey],
        kinds: [kinds.Relaysets],
      }
    : undefined;
  const { timeline } = useTimelineLoader(`${truncateId(pubkey || "anon")}-relay-sets`, readRelays, filters, {
    eventFilter,
  });

  return timeline;
}
