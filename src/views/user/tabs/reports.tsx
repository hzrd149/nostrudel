import { Flex, Text } from "@chakra-ui/react";
import { isETag, isPTag } from "applesauce-core/helpers";
import { kinds, NostrEvent } from "nostr-tools";

import ScrollLayout from "../../../components/layout/presets/scroll-layout";
import { NoteLink } from "../../../components/note/note-link";
import TimelineActionAndStatus from "../../../components/timeline/timeline-action-and-status";
import UserLink from "../../../components/user/user-link";
import { filterTagsByContentRefs } from "../../../helpers/nostr/event";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import useParamsProfilePointer from "../../../hooks/use-params-pubkey-pointer";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import useUserMailboxes from "../../../hooks/use-user-mailboxes";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";

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
  const user = useParamsProfilePointer("pubkey");
  const mailboxes = useUserMailboxes(user);
  const readRelays = useReadRelays();

  const { loader, timeline: events } = useTimelineLoader(`${user.pubkey}-reports`, mailboxes?.outboxes || readRelays, [
    {
      authors: [user.pubkey],
      kinds: [kinds.Report],
    },
    {
      "#p": [user.pubkey],
      kinds: [kinds.Report],
    },
  ]);
  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <ScrollLayout>
      <IntersectionObserverProvider callback={callback}>
        {events?.map((report) => (
          <ReportEvent key={report.id} report={report} />
        ))}

        <TimelineActionAndStatus loader={loader} />
      </IntersectionObserverProvider>
    </ScrollLayout>
  );
}
