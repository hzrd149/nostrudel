import { Button, Flex, Spinner } from "@chakra-ui/react";
import moment from "moment";
import { useOutletContext } from "react-router-dom";
import { Note } from "../../components/note";
import { isNote } from "../../helpers/nostr-event";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";

const UserNotesTab = () => {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const relays = useReadRelayUrls();

  const { events, loading, loadMore } = useTimelineLoader(
    `${pubkey} notes`,
    relays,
    { authors: [pubkey], kinds: [1], since: moment().subtract(1, "day").unix() },
    { pageSize: moment.duration(1, "day").asSeconds() }
  );
  const timeline = events.filter(isNote);

  return (
    <Flex direction="column" gap="2" pr="2" pl="2">
      {timeline.map((event) => (
        <Note key={event.id} event={event} maxHeight={300} />
      ))}
      {loading ? <Spinner ml="auto" mr="auto" mt="8" mb="8" /> : <Button onClick={() => loadMore()}>Load More</Button>}
    </Flex>
  );
};

export default UserNotesTab;
