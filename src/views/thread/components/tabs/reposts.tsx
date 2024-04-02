import { Flex, Text } from "@chakra-ui/react";
import { kinds } from "nostr-tools";

import UserAvatarLink from "../../../../components/user/user-avatar-link";
import UserLink from "../../../../components/user/user-link";
import useTimelineLoader from "../../../../hooks/use-timeline-loader";
import { useReadRelays } from "../../../../hooks/use-client-relays";
import useSubject from "../../../../hooks/use-subject";
import Timestamp from "../../../../components/timestamp";
import { ThreadItem } from "../../../../helpers/thread";

export default function PostRepostsTab({ post }: { post: ThreadItem }) {
  const readRelays = useReadRelays();
  const timeline = useTimelineLoader(`${post.event.id}-reposts`, readRelays, {
    kinds: [kinds.Repost, kinds.GenericRepost],
    "#e": [post.event.id],
  });

  const reposts = useSubject(timeline.timeline);

  return (
    <Flex direction="column" gap="2" px="2">
      {reposts.map((repost) => (
        <Flex key={repost.id} gap="2" alignItems="center">
          <UserAvatarLink pubkey={repost.pubkey} size="sm" />
          <UserLink pubkey={repost.pubkey} fontWeight="bold" />
          <Text>Shared</Text>
          <Timestamp timestamp={repost.created_at} />
        </Flex>
      ))}
    </Flex>
  );
}
