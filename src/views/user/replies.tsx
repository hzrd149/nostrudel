import { Button, Flex, SkeletonText } from "@chakra-ui/react";
import { Post } from "../../components/post";
import { isReply } from "../../helpers/nostr-event";
import { useUserTimeline } from "../../hooks/use-user-timeline";

export const UserRepliesTab = ({ pubkey }: { pubkey: string }) => {
  const { timeline, more } = useUserTimeline(pubkey, isReply);

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
