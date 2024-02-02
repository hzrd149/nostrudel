import { kinds } from "nostr-tools";

import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import GenericNoteTimeline from "../../components/timeline-page/generic-note-timeline";
import { usePeopleListContext } from "../../providers/local/people-list-provider";
import { useAdditionalRelayContext } from "../../providers/local/additional-relay-context";

export default function NoteSearchResults({ search }: { search: string }) {
  const searchRelays = useAdditionalRelayContext();
  const { listId, filter } = usePeopleListContext();

  const timeline = useTimelineLoader(
    `${listId ?? "global"}-${search}-note-search`,
    searchRelays,
    search ? { search: search, kinds: [kinds.ShortTextNote], ...filter } : undefined,
  );

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <GenericNoteTimeline timeline={timeline} />
    </IntersectionObserverProvider>
  );
}
