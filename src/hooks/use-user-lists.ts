import { useCallback } from "react";
import { NOTE_LIST_KIND, PEOPLE_LIST_KIND, isJunkList } from "../helpers/nostr/lists";
import { useReadRelayUrls } from "./use-client-relays";
import useSubject from "./use-subject";
import useTimelineLoader from "./use-timeline-loader";
import { NostrEvent } from "../types/nostr-event";

export default function useUserLists(pubkey?: string, additionalRelays: string[] = []) {
  const readRelays = useReadRelayUrls(additionalRelays);
  const eventFilter = useCallback((event: NostrEvent) => {
    return !isJunkList(event);
  }, []);
  const timeline = useTimelineLoader(
    `${pubkey}-lists`,
    readRelays,
    {
      authors: pubkey ? [pubkey] : [],
      kinds: [PEOPLE_LIST_KIND, NOTE_LIST_KIND],
    },
    { enabled: !!pubkey, eventFilter },
  );

  return useSubject(timeline.timeline);
}
