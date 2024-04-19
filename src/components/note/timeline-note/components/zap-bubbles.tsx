import { Flex, FlexProps, Tag, TagLabel } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { getEventUID } from "nostr-idb";
import styled from "@emotion/styled";

import useEventZaps from "../../../../hooks/use-event-zaps";
import UserAvatar from "../../../user/user-avatar";
import { readablizeSats } from "../../../../helpers/bolt11";
import { LightningIcon } from "../../../icons";

const HiddenScrollbar = styled(Flex)`
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
  &::-webkit-scrollbar {
    display: none;
  }
`;

export default function ZapBubbles({ event, ...props }: { event: NostrEvent } & Omit<FlexProps, "children">) {
  const zaps = useEventZaps(getEventUID(event));

  if (zaps.length === 0) return null;

  const sorted = zaps.sort((a, b) => (b.payment.amount ?? 0) - (a.payment.amount ?? 0));

  return (
    <HiddenScrollbar overflowY="hidden" overflowX="auto" gap="2" {...props}>
      {sorted.map((zap) => (
        <Tag key={zap.event.id} borderRadius="full" py="1" flexShrink={0} variant="outline">
          <LightningIcon mr="1" color="yellow.400" />
          <TagLabel fontWeight="bold">{readablizeSats((zap.payment.amount ?? 0) / 1000)}</TagLabel>
          <UserAvatar pubkey={zap.request.pubkey} size="xs" square={false} ml="2" />
        </Tag>
      ))}
    </HiddenScrollbar>
  );
}
