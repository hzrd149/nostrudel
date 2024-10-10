import { useCallback } from "react";

import { NOTE_LIST_KIND, PEOPLE_LIST_KIND, isJunkList } from "../helpers/nostr/lists";
import { useReadRelays } from "./use-client-relays";
import useTimelineLoader from "./use-timeline-loader";
import { NostrEvent } from "../types/nostr-event";
import { truncateId } from "../helpers/string";

export default function useUserLists(pubkey?: string, additionalRelays?: Iterable<string>) {
  const readRelays = useReadRelays(additionalRelays);
  const eventFilter = useCallback((event: NostrEvent) => {
    return !isJunkList(event);
  }, []);

  const { timeline } = useTimelineLoader(
    `${truncateId(pubkey ?? "anon")}-lists`,
    readRelays,
    pubkey
      ? {
          authors: [pubkey],
          kinds: [PEOPLE_LIST_KIND, NOTE_LIST_KIND],
        }
      : undefined,
    { eventFilter },
  );

  return timeline;
}
