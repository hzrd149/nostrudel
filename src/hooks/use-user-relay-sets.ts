import { useCallback } from "react";
import { kinds } from "nostr-tools";
import { useStoreQuery } from "applesauce-react/hooks";
import { Queries } from "applesauce-core";

import { useReadRelays } from "./use-client-relays";
import useTimelineLoader from "./use-timeline-loader";
import { NostrEvent, isRTag } from "../types/nostr-event";
import { truncateId } from "../helpers/string";

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
