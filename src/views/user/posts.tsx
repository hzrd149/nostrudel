import { Button, Flex, Spinner } from "@chakra-ui/react";
import moment from "moment";
import { Post } from "../../components/post";
import { isPost } from "../../helpers/nostr-event";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";

export const UserPostsTab = ({ pubkey }: { pubkey: string }) => {
  const { events, loading, loadMore } = useTimelineLoader(
    `${pubkey} posts`,
    { authors: [pubkey], kinds: [1], since: moment().subtract(1, "day").unix() },
    { pageSize: moment.duration(1, "day").asSeconds() }
  );
  const timeline = events.filter(isPost);

  return (
    <Flex direction="column" gap="2" pr="2" pl="2">
      {timeline.map((event) => (
        <Post key={event.id} event={event} />
      ))}
      {loading ? <Spinner ml="auto" mr="auto" mt="8" mb="8" /> : <Button onClick={() => loadMore()}>Load More</Button>}
    </Flex>
  );
};
