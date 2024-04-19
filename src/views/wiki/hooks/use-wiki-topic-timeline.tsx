import { NostrEvent } from "nostr-tools";

import { WIKI_PAGE_KIND, validatePage } from "../../../helpers/nostr/wiki";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import { WIKI_RELAYS } from "../../../const";

function eventFilter(event: NostrEvent) {
  if (!validatePage(event)) return false;
  return event.content.length > 0;
}

export default function useWikiTopicTimeline(topic: string) {
  const relays = useReadRelays(WIKI_RELAYS);

  return useTimelineLoader(
    `wiki-${topic.toLocaleLowerCase()}-pages`,
    relays,
    [{ kinds: [WIKI_PAGE_KIND], "#d": [topic.toLocaleLowerCase()] }],
    { eventFilter: eventFilter },
  );
}
