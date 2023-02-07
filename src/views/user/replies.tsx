import { Button, Flex, SkeletonText } from "@chakra-ui/react";
import { Post } from "../../components/post";
import { isReply } from "../../helpers/nostr-event";
import { useEventTimelineLoader } from "../../hooks/use-event-timeline-loader";

export const UserRepliesTab = ({ pubkey }: { pubkey: string }) => {
  const { timeline, more } = useEventTimelineLoader(
    { authors: [pubkey], kinds: [1] },
    { filter: isReply, name: "user replies" }
  );

  if (timeline.length === 0) {
    return <SkeletonText />;
  }

  return (
    <Flex direction="column" gap="2" pr="2" pl="2">
      {timeline.map((event) => (
        <Post key={event.id} event={event} />
      ))}
      <Button onClick={() => more(1)}>Load More</Button>
    </Flex>
  );
};
