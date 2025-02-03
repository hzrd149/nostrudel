import { Flex, Text } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";
import { kinds } from "nostr-tools";

import { NoteLink } from "../../components/note/note-link";
import UserLink from "../../components/user/user-link";
import { filterTagsByContentRefs } from "../../helpers/nostr/event";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { isETag, isPTag, NostrEvent } from "../../types/nostr-event";
import { useAdditionalRelayContext } from "../../providers/local/additional-relay-context";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import VerticalPageLayout from "../../components/vertical-page-layout";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";

function ReportEvent({ report }: { report: NostrEvent }) {
  const reportedEvent = report.tags.filter(isETag)[0]?.[1];
  const reportedPubkey = filterTagsByContentRefs(report.content, report.tags, false).filter(isPTag)[0]?.[1];
  if (!reportedEvent && !reportedPubkey) return null;
  const reason = report.tags.find((t) => t[0] === "report")?.[1];

  const ref = useEventIntersectionRef(report);

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

  const { loader, timeline: events } = useTimelineLoader(`${pubkey}-reports`, contextRelays, [
    {
      authors: [pubkey],
      kinds: [kinds.Report],
    },
    {
      "#p": [pubkey],
      kinds: [kinds.Report],
    },
  ]);
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <IntersectionObserverProvider callback={callback}>
      <VerticalPageLayout>
        {events?.map((report) => <ReportEvent key={report.id} report={report} />)}

        <TimelineActionAndStatus loader={loader} />
      </VerticalPageLayout>
    </IntersectionObserverProvider>
  );
}
