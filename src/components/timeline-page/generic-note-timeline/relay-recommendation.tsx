import { Flex, Text } from "@chakra-ui/react";

import { NostrEvent } from "../../../types/nostr-event";
import UserAvatar from "../../user/user-avatar";
import UserLink from "../../user/user-link";
import RelayCard from "../../../views/relays/components/relay-card";
import { safeRelayUrl } from "../../../helpers/relay";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";

export default function RelayRecommendation({ event }: { event: NostrEvent }) {
  const safeUrl = safeRelayUrl(event.content);
  const ref = useEventIntersectionRef(event);

  return (
    <Flex gap="2" direction="column" ref={ref}>
      <Flex gap="2">
        <UserAvatar pubkey={event.pubkey} size="xs" alignItems="center" />
        <UserLink pubkey={event.pubkey} />
        <Text>Recommended relay:</Text>
      </Flex>
      {safeUrl ? <RelayCard url={safeUrl} /> : event.content}
    </Flex>
  );
}
