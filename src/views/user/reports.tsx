import { Box, Button, Flex, Spinner, Text } from "@chakra-ui/react";
import moment from "moment";
import { useOutletContext } from "react-router-dom";
import { RelayMode } from "../../classes/relay";
import { NoteLink } from "../../components/note-link";
import { UserLink } from "../../components/user-link";
import { filterTagsByContentRefs, truncatedId } from "../../helpers/nostr-event";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import useFallbackUserRelays from "../../hooks/use-fallback-user-relays";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";
import relayScoreboardService from "../../services/relay-scoreboard";
import { isETag, isPTag, NostrEvent } from "../../types/nostr-event";

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
  // get user relays
  const userRelays = useFallbackUserRelays(pubkey)
    .filter((r) => r.mode & RelayMode.WRITE)
    .map((r) => r.url);
  // merge the users relays with client relays
  const readRelays = useReadRelayUrls();
  // find the top 4
  const relays = relayScoreboardService.getRankedRelays(userRelays.length === 0 ? readRelays : userRelays).slice(0, 4);

  const {
    events: reports,
    loading,
    loadMore,
  } = useTimelineLoader(
    `${truncatedId(pubkey)}-reports`,
    relays,
    { authors: [pubkey], kinds: [1984] },
    { pageSize: moment.duration(1, "week").asSeconds() }
  );

  return (
    <Flex direction="column" gap="2" pr="2" pl="2">
      {reports.map((report) => (
        <ReportEvent key={report.id} report={report} />
      ))}
      {loading ? <Spinner ml="auto" mr="auto" mt="8" mb="8" /> : <Button onClick={() => loadMore()}>Load More</Button>}
    </Flex>
  );
}
