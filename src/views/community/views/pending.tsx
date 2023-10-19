import { useRef } from "react";
import { Box } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";

import { NostrEvent } from "../../../types/nostr-event";
import { getEventUID } from "../../../helpers/nostr/events";
import { COMMUNITY_APPROVAL_KIND, buildApprovalMap } from "../../../helpers/nostr/communities";
import useSubject from "../../../hooks/use-subject";
import IntersectionObserverProvider, { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";
import { EmbedEvent } from "../../../components/embed-event";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import TimelineActionAndStatus from "../../../components/timeline-page/timeline-action-and-status";
import TimelineLoader from "../../../classes/timeline-loader";

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
  const { community, timeline } = useOutletContext() as { community: NostrEvent; timeline: TimelineLoader };

  const events = useSubject(timeline.timeline);

  const approvals = buildApprovalMap(events);
  const pending = events.filter((e) => e.kind !== COMMUNITY_APPROVAL_KIND && !approvals.has(e.id));

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
