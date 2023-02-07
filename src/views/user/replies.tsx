import { Button, Flex, Spinner } from "@chakra-ui/react";
import moment from "moment";
import { Post } from "../../components/post";
import { isReply } from "../../helpers/nostr-event";
import { useTimelineLoader } from "../../hooks/use-timeline-loader";

export const UserRepliesTab = ({ pubkey }: { pubkey: string }) => {
  const { loader, events, loading } = useTimelineLoader(
    `${pubkey} replies`,
    { authors: [pubkey], kinds: [1], since: moment().subtract(4, "hours").unix() },
    { pageSize: moment.duration(1, "day").asSeconds() }
  );
  const timeline = events.filter(isReply);

  return (
    <Flex direction="column" gap="2" pr="2" pl="2">
      {timeline.map((event) => (
        <Post key={event.id} event={event} />
      ))}
      {loading ? (
        <Spinner ml="auto" mr="auto" mt="8" mb="8" />
      ) : (
        <Button onClick={() => loader?.loadMore()}>Load More</Button>
      )}
    </Flex>
  );
};
