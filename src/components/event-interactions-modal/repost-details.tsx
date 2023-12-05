import { Button, Flex, SimpleGrid, SimpleGridProps, Text, useDisclosure } from "@chakra-ui/react";
import { Kind } from "nostr-tools";

import { NostrEvent } from "../../types/nostr-event";
import UserAvatarLink from "../user-avatar-link";
import UserLink from "../user-link";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import useSubject from "../../hooks/use-subject";
import Timestamp from "../timestamp";

export default function RepostDetails({ event }: { event: NostrEvent }) {
  const readRelays = useReadRelayUrls();
  const timeline = useTimelineLoader(`${event.id}-reposts`, readRelays, { kinds: [Kind.Repost], "#e": [event.id] });

  const reposts = useSubject(timeline.timeline);

  return (
    <>
      {reposts.map((repost) => (
        <Flex key={repost.id} gap="2" alignItems="center">
          <UserAvatarLink pubkey={repost.pubkey} size="sm" />
          <UserLink pubkey={repost.pubkey} fontWeight="bold" />
          <Text>Shared</Text>
          <Timestamp timestamp={repost.created_at} />
        </Flex>
      ))}
    </>
  );
}
