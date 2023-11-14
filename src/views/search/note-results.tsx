import { Kind } from "nostr-tools";

import { useRelaySelectionRelays } from "../../providers/relay-selection-provider";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/intersection-observer";
import GenericNoteTimeline from "../../components/timeline-page/generic-note-timeline";
import { usePeopleListContext } from "../../providers/people-list-provider";

export default function NoteSearchResults({ search }: { search: string }) {
  const searchRelays = useRelaySelectionRelays();
  const { listId, filter } = usePeopleListContext();

  const timeline = useTimelineLoader(
    `${listId ?? "global"}-${search}-note-search`,
    searchRelays,
    { search: search || "", kinds: [Kind.Text], ...filter },
    { enabled: !!search },
  );

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <GenericNoteTimeline timeline={timeline} />
    </IntersectionObserverProvider>
  );
}
