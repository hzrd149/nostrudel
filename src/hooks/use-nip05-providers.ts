import { kinds } from "nostr-tools";

import useTimelineLoader from "./use-timeline-loader";
import { recommendedReadRelays } from "../services/client-relays";
import useSubject from "./use-subject";

export default function useNip05Providers() {
  const timeline = useTimelineLoader("nip05-providers", recommendedReadRelays, {
    kinds: [kinds.Handlerinformation],
    "#k": [String(kinds.NostrConnect)],
  });

  return useSubject(timeline.timeline);
}
