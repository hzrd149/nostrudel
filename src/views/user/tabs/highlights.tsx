import { kinds } from "nostr-tools";

import GenericNoteTimeline from "../../../components/timeline-page/generic-note-timeline";
import LoadMoreButton from "../../../components/timeline/load-more-button";
import VerticalPageLayout from "../../../components/vertical-page-layout";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import { useUserOutbox as useUserOutboxes } from "../../../hooks/use-user-mailboxes";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";

export default function UserHighlightsTab() {
  const user = useParamsProfilePointer("pubkey");
  const relays = useUserOutboxes(user) || [];

  const { loader, timeline } = useTimelineLoader(user.pubkey + "-highlights", relays, {
    authors: [user.pubkey],
    kinds: [kinds.Highlights],
  });

  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout maxW="6xl" mx="auto">
        <GenericNoteTimeline timeline={timeline} />
        <LoadMoreButton loader={loader} />
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}
