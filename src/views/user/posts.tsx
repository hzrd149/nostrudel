import { Button, Flex, Spinner } from "@chakra-ui/react";
import { Post } from "../../components/post";
import { isPost } from "../../helpers/nostr-event";
import { useEventTimelineLoader } from "../../hooks/use-event-timeline-loader";

export const UserPostsTab = ({ pubkey }: { pubkey: string }) => {
  const { timeline, more } = useEventTimelineLoader(
    { authors: [pubkey], kinds: [1] },
    { filter: isPost, name: "user posts" }
  );

  return (
    <Flex direction="column" gap="2" pr="2" pl="2">
      {timeline.length > 0 ? (
        timeline.map((event) => <Post key={event.id} event={event} />)
      ) : (
        <Spinner ml="auto" mr="auto" mt="8" mb="8" />
      )}
      <Button onClick={() => more(1)}>Load More</Button>
    </Flex>
  );
};
