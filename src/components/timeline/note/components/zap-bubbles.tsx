import { Flex, FlexProps, Tag, TagLabel } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import styled from "@emotion/styled";
import { Zap } from "applesauce-common/casts";

import useCastTimeline from "../../../../hooks/use-cast-timeline";
import useEventZaps from "../../../../hooks/use-event-zaps";
import UserAvatarLink from "../../../user/user-avatar-link";
import { LightningIcon } from "../../../icons";
import ValueDisplay from "../../../value-display";

function ZapBubble({ zap }: { zap: Zap }) {
  return (
    <Tag key={zap.id} borderRadius="full" py="1" flexShrink={0} variant="outline">
      <LightningIcon mr="1" color="yellow.400" />
      <TagLabel fontWeight="bold">
        <ValueDisplay sats={(zap.amount ?? 0) / 1000} />
      </TagLabel>
      <UserAvatarLink pubkey={zap.sender.pubkey} size="xs" square={false} ml="2" />
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
  const zaps = useCastTimeline(useEventZaps(event), Zap);
  const sorted = [...zaps].sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0));

  if (sorted.length === 0) return null;

  return (
    <HiddenScrollbar overflowY="hidden" overflowX="auto" gap="2" {...props}>
      {sorted.map((zap) => (
        <ZapBubble key={zap.id} zap={zap} />
      ))}
    </HiddenScrollbar>
  );
}
