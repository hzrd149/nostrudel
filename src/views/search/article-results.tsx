import { kinds } from "nostr-tools";

import { useRelaySelectionRelays } from "../../providers/local/relay-selection-provider";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import GenericNoteTimeline from "../../components/timeline-page/generic-note-timeline";
import { usePeopleListContext } from "../../providers/local/people-list-provider";

export default function ArticleSearchResults({ search }: { search: string }) {
  const searchRelays = useRelaySelectionRelays();
  const { listId, filter } = usePeopleListContext();

  const timeline = useTimelineLoader(
    `${listId ?? "global"}-${search}-article-search`,
    searchRelays,
    search ? { search: search, kinds: [kinds.LongFormArticle], ...filter } : undefined,
  );

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <GenericNoteTimeline timeline={timeline} />
    </IntersectionObserverProvider>
  );
}
