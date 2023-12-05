import { useRef } from "react";
import { Flex, Text } from "@chakra-ui/react";

import { NostrEvent } from "../../../types/nostr-event";
import UserAvatar from "../../user-avatar";
import UserLink from "../../user-link";
import RelayCard from "../../../views/relays/components/relay-card";
import { safeRelayUrl } from "../../../helpers/url";
import { useRegisterIntersectionEntity } from "../../../providers/intersection-observer";

export default function RelayRecommendation({ event }: { event: NostrEvent }) {
  const safeUrl = safeRelayUrl(event.content);

  // if there is a parent intersection observer, register this card
  const ref = useRef<HTMLDivElement | null>(null);
  useRegisterIntersectionEntity(ref, event.id);

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
