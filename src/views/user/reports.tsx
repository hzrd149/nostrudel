import { useRef } from "react";
import { Flex, Text } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";
import { Kind } from "nostr-tools";

import { NoteLink } from "../../components/note-link";
import UserLink from "../../components/user-link";
import { filterTagsByContentRefs, getEventUID } from "../../helpers/nostr/events";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { isETag, isPTag, NostrEvent } from "../../types/nostr-event";
import { useAdditionalRelayContext } from "../../providers/additional-relay-context";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import useSubject from "../../hooks/use-subject";
import IntersectionObserverProvider, { useRegisterIntersectionEntity } from "../../providers/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import VerticalPageLayout from "../../components/vertical-page-layout";

function ReportEvent({ report }: { report: NostrEvent }) {
  const reportedEvent = report.tags.filter(isETag)[0]?.[1];
  const reportedPubkey = filterTagsByContentRefs(report.content, report.tags, false).filter(isPTag)[0]?.[1];
  if (!reportedEvent && !reportedPubkey) return null;
  const reason = report.tags.find((t) => t[0] === "report")?.[1];

  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, getEventUID(report));

  return (
    <Flex gap="2" ref={ref}>
      <UserLink pubkey={report.pubkey} color="blue.500" />
      <Text>reported</Text>
      {reportedEvent ? (
        <>
          <NoteLink noteId={reportedEvent} />
          {reportedPubkey && (
            <>
              <Text>by</Text>
              <UserLink pubkey={reportedPubkey} color="blue.500" />
            </>
          )}
        </>
      ) : (
        <UserLink pubkey={reportedPubkey} color="blue.500" />
      )}
      {reason && <Text>for {reason}</Text>}
    </Flex>
  );
}

export default function UserReportsTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const contextRelays = useAdditionalRelayContext();

  const timeline = useTimelineLoader(`${pubkey}-reports`, contextRelays, [
    {
      authors: [pubkey],
      kinds: [Kind.Report],
    },
    {
      "#p": [pubkey],
      kinds: [Kind.Report],
    },
  ]);

  const events = useSubject(timeline.timeline);
  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        {events.map((report) => (
          <ReportEvent key={report.id} report={report} />
        ))}

        <TimelineActionAndStatus timeline={timeline} />
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}
