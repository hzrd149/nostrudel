import { NOTE_LIST_KIND, PEOPLE_LIST_KIND } from "../helpers/nostr/lists";
import { useReadRelayUrls } from "./use-client-relays";
import useSubject from "./use-subject";
import useTimelineLoader from "./use-timeline-loader";

export default function useUserLists(pubkey: string, additionalRelays: string[] = []) {
  const readRelays = useReadRelayUrls(additionalRelays);
  const timeline = useTimelineLoader(`${pubkey}-lists`, readRelays, {
    authors: [pubkey],
    kinds: [PEOPLE_LIST_KIND, NOTE_LIST_KIND],
  });

  return useSubject(timeline.timeline);
}
