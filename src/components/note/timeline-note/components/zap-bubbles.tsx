import { Flex, FlexProps, Tag, TagLabel } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { getEventUID } from "nostr-idb";
import styled from "@emotion/styled";
import { getZapPayment, getZapRequest } from "applesauce-core/helpers";

import useEventZaps from "../../../../hooks/use-event-zaps";
import UserAvatar from "../../../user/user-avatar";
import { humanReadableSats } from "../../../../helpers/lightning";
import { LightningIcon } from "../../../icons";

function ZapBubble({ zap }: { zap: NostrEvent }) {
  const request = getZapRequest(zap);
  const payment = getZapPayment(zap);

  if (!payment) return null;

  return (
    <Tag key={zap.id} borderRadius="full" py="1" flexShrink={0} variant="outline">
      <LightningIcon mr="1" color="yellow.400" />
      <TagLabel fontWeight="bold">{humanReadableSats((payment.amount ?? 0) / 1000)}</TagLabel>
      <UserAvatar pubkey={request.pubkey} size="xs" square={false} ml="2" />
    </Tag>
  );
}
const HiddenScrollbar = styled(Flex)`
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
  &::-webkit-scrollbar {
    display: none;
  }
`;

export default function ZapBubbles({ event, ...props }: { event: NostrEvent } & Omit<FlexProps, "children">) {
  const zaps = useEventZaps(event);

  if (!zaps || zaps.length === 0) return null;

  const sorted = zaps.sort((a, b) => (getZapPayment(b)?.amount ?? 0) - (getZapPayment(a)?.amount ?? 0));

  return (
    <HiddenScrollbar overflowY="hidden" overflowX="auto" gap="2" {...props}>
      {sorted.map((zap) => (
        <ZapBubble key={zap.id} zap={zap} />
      ))}
    </HiddenScrollbar>
  );
}
