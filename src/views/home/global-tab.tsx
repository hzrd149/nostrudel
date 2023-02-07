import { Button, Flex, Spinner } from "@chakra-ui/react";
import moment from "moment";
import { Post } from "../../components/post";
import { isPost } from "../../helpers/nostr-event";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";

export const GlobalTab = () => {
  const { events, loading, loadMore } = useTimelineLoader(
    `global-posts`,
    { kinds: [1], since: moment().subtract(5, "minutes").unix() },
    { pageSize: moment.duration(5, "minutes").asSeconds() }
  );

  const timeline = events.filter(isPost);

  return (
    <Flex direction="column" overflow="auto" gap="2">
      {timeline.map((event) => (
        <Post key={event.id} event={event} />
      ))}
      {loading ? <Spinner ml="auto" mr="auto" mt="8" mb="8" /> : <Button onClick={() => loadMore()}>Load More</Button>}
    </Flex>
  );
};
