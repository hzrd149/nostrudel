import { Flex, Text } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";
import { NoteLink } from "../../components/note-link";
import { UserLink } from "../../components/user-link";
import { filterTagsByContentRefs, truncatedId } from "../../helpers/nostr-event";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";
import { isETag, isPTag, NostrEvent } from "../../types/nostr-event";
import { useAdditionalRelayContext } from "../../providers/additional-relay-context";
import LoadMoreButton from "../../components/load-more-button";

function ReportEvent({ report }: { report: NostrEvent }) {
  const reportedEvent = report.tags.filter(isETag)[0]?.[1];
  const reportedPubkey = filterTagsByContentRefs(report.content, report.tags, false).filter(isPTag)[0]?.[1];
  if (!reportedEvent && !reportedPubkey) return null;
  const reason = report.tags.find((t) => t[0] === "report")?.[1];

  return (
    <Flex gap="2">
      {reportedEvent ? (
        <>
          <NoteLink noteId={reportedEvent} />
          {reportedPubkey && (
            <>
              <Text>From</Text>
              <UserLink pubkey={reportedPubkey} color="blue.500" />
            </>
          )}
        </>
      ) : (
        <UserLink pubkey={reportedPubkey} color="blue.500" />
      )}
      <Text>{reason}</Text>
    </Flex>
  );
}

export default function UserReportsTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const contextRelays = useAdditionalRelayContext();

  const { timeline, loader } = useTimelineLoader(`${truncatedId(pubkey)}-reports`, contextRelays, {
    authors: [pubkey],
    kinds: [1984],
  });

  return (
    <Flex direction="column" gap="2" pr="2" pl="2">
      {timeline.map((report) => (
        <ReportEvent key={report.id} report={report} />
      ))}

      <LoadMoreButton timeline={loader} />
    </Flex>
  );
}
