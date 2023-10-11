import { useCallback, useRef } from "react";
import { Box } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";
import { Kind } from "nostr-tools";

import { NostrEvent, isETag } from "../../../types/nostr-event";
import { getEventCoordinate, getEventUID } from "../../../helpers/nostr/events";
import { COMMUNITY_APPROVAL_KIND, getCommunityRelays } from "../../../helpers/nostr/communities";
import { useReadRelayUrls } from "../../../hooks/use-client-relays";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import useSubject from "../../../hooks/use-subject";
import IntersectionObserverProvider, { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import { EmbedEvent } from "../../../components/embed-event";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import TimelineActionAndStatus from "../../../components/timeline-page/timeline-action-and-status";
import EventStore from "../../../classes/event-store";

function PendingPost({ event }: { event: NostrEvent }) {
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(event));

  return (
    <Box ref={ref}>
      <EmbedEvent event={event} />
    </Box>
  );
}

export default function CommunityPendingView() {
  const { community } = useOutletContext() as { community: NostrEvent };

  const readRelays = useReadRelayUrls(getCommunityRelays(community));

  const eventFilter = useCallback((event: NostrEvent, store: EventStore) => event.kind !== COMMUNITY_APPROVAL_KIND, []);
  const timeline = useTimelineLoader(
    `${getEventUID(community)}-pending-posts`,
    readRelays,
    {
      kinds: [Kind.Text, COMMUNITY_APPROVAL_KIND],
      "#a": [getEventCoordinate(community)],
    },
    { eventFilter },
  );

  const events = useSubject(timeline.timeline);

  const approvals = new Set<string>();
  for (const [_, event] of timeline.events.events) {
    if (event.kind === COMMUNITY_APPROVAL_KIND) {
      for (const tag of event.tags) {
        if (isETag(tag)) approvals.add(tag[1]);
      }
    }
  }
  const pending = events.filter((e) => !approvals.has(e.id));

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <>
      <IntersectionObserverProvider callback={callback}>
        {pending.map((event) => (
          <PendingPost key={getEventUID(event)} event={event} />
        ))}
      </IntersectionObserverProvider>
      <TimelineActionAndStatus timeline={timeline} />
    </>
  );
}
