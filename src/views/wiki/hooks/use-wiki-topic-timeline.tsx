import { WIKI_PAGE_KIND } from "../../../helpers/nostr/wiki";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useTimelineLoader from "../../../hooks/use-timeline-loader";

export default function useWikiTopicTimeline(topic: string) {
  const relays = useReadRelays(["wss://relay.wikifreedia.xyz/"]);

  return useTimelineLoader(
    `wiki-${topic.toLocaleLowerCase()}-pages`,
    relays,
    [{ kinds: [WIKI_PAGE_KIND], "#d": [topic.toLocaleLowerCase()] }],
    { eventFilter: (e) => e.content.length > 0 },
  );
}
