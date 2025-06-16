import { Flex, Text } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { ThreadItem } from "applesauce-core/models";

import UserAvatarLink from "../../../../components/user/user-avatar-link";
import UserLink from "../../../../components/user/user-link";
import Timestamp from "../../../../components/timestamp";

export default function PostRepostsTab({ post, reposts }: { post: ThreadItem; reposts: NostrEvent[] }) {
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
