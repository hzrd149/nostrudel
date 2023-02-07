import { useEffect } from "react";
import { Flex, SkeletonText } from "@chakra-ui/react";
import { useSubscription } from "../../hooks/use-subscription";
import { Post } from "../../components/post";
import settings from "../../services/settings";
import useSubject from "../../hooks/use-subject";
import { useEventDir } from "../../hooks/use-event-dir";

export const UserRepliesTab = ({ pubkey }: { pubkey: string }) => {
  const relays = useSubject(settings.relays);

  const sub = useSubscription(
    relays,
    { authors: [pubkey], kinds: [1] },
    `${pubkey} posts`
  );

  const { events, reset } = useEventDir(
    sub,
    (event) => !!event.tags.find((t) => t[0] === "e")
  );

  // clear events when pubkey changes
  useEffect(() => reset(), [pubkey]);

  const timeline = Object.values(events).sort(
    (a, b) => b.created_at - a.created_at
  );

  if (timeline.length === 0) {
    return <SkeletonText />;
  }

  if (timeline.length > 20) timeline.length = 20;

  return (
    <Flex direction="column" gap="2" pr="2" pl="2">
      {timeline.map((event) => (
        <Post key={event.id} event={event} />
      ))}
    </Flex>
  );
};
