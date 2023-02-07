import { Button, Flex, Spinner } from "@chakra-ui/react";
import moment from "moment";
import { Note } from "../../components/note";
import { isNote } from "../../helpers/nostr-event";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";

export const GlobalTab = () => {
  const { events, loading, loadMore } = useTimelineLoader(
    `global`,
    { kinds: [1], since: moment().subtract(5, "minutes").unix() },
    { pageSize: moment.duration(5, "minutes").asSeconds() }
  );

  const timeline = events.filter(isNote);

  return (
    <Flex direction="column" overflow="auto" gap="2">
      {timeline.map((event) => (
        <Note key={event.id} event={event} />
      ))}
      {loading ? <Spinner ml="auto" mr="auto" mt="8" mb="8" /> : <Button onClick={() => loadMore()}>Load More</Button>}
    </Flex>
  );
};
