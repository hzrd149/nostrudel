import { Box, Flex, LinkBox, Text } from "@chakra-ui/react";
import { Zap } from "applesauce-common/casts";
import { getTagValue, naddrEncode, neventEncode } from "applesauce-core/helpers";
import { memo, useMemo } from "react";

import HoverLinkOverlay from "../../../../components/hover-link-overlay";
import RouterLink from "../../../../components/router-link";
import Timestamp from "../../../../components/timestamp";
import UserAvatar from "../../../../components/user/user-avatar";
import UserName from "../../../../components/user/user-name";
import ValueDisplay from "../../../../components/value-display";
import { TZapGroup } from "../../../../helpers/nostr/zaps";
import useCastTimeline from "../../../../hooks/use-cast-timeline";
import useEventIntersectionRef from "../../../../hooks/use-event-intersection-ref";
import useReplaceableEvent from "../../../../hooks/use-replaceable-event";
import useSingleEvent from "../../../../hooks/use-single-event";

function ZapBubble({ zap }: { zap: Zap }) {
  return (
    <Box display="flex" alignItems="center" gap="2">
      <UserAvatar pubkey={zap.sender.pubkey} size="sm" showNip05={false} />
      <ValueDisplay sats={zap.amount / 1000} fontWeight="bold" />
    </Box>
  );
}

function ZapGroup({ group }: { group: TZapGroup }) {
  // Try to load the zapped event
  const singleEvent = useSingleEvent(group.eventPointer);
  const replaceableEvent = useReplaceableEvent(group.addressPointer);
  const event = replaceableEvent || singleEvent;
  const ref = useEventIntersectionRef(group.events[0]);

  // Sort zaps by amount (highest first)
  const zaps = useCastTimeline(group.events, Zap);
  const sortedZaps = useMemo(() => [...zaps].sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0)), [zaps]);

  const link = useMemo(() => {
    if (group.addressPointer) return `/l/${naddrEncode(group.addressPointer)}`;
    return `/l/${neventEncode(group.eventPointer)}`;
  }, [group]);

  return (
    <Flex as={LinkBox} direction="column" overflow="hidden" p="2" gap="2" ref={ref}>
      {/* Zapped Event */}
      {event ? (
        <Flex overflow="hidden" alignItems="center" gap="2">
          <UserName pubkey={event.pubkey} fontWeight="bold" />
          <Text fontSize="sm" color="gray.500" isTruncated flex={1}>
            {getTagValue(event, "title") || event.content}
          </Text>
          <Timestamp timestamp={group.latest} />
        </Flex>
      ) : (
        <Flex overflow="hidden" alignItems="center" gap="2">
          <Text color="gray.500">Loading zapped note...</Text>
          <Timestamp timestamp={group.latest} />
        </Flex>
      )}

      {/* Zap Bubbles */}
      {sortedZaps.length > 0 && sortedZaps.length === 1 ? (
        <Box display="flex" alignItems="center" gap="2">
          <UserAvatar pubkey={sortedZaps[0].sender.pubkey} size="sm" showNip05={false} />
          <Text>
            <UserName pubkey={sortedZaps[0].sender.pubkey} fontWeight="bold" /> Zapped
          </Text>
          <ValueDisplay sats={sortedZaps[0].amount / 1000} fontWeight="bold" />
        </Box>
      ) : (
        <Flex gap="2" overflow="hidden">
          {sortedZaps.map((zap) => (
            <ZapBubble key={zap.id} zap={zap} />
          ))}
        </Flex>
      )}

      <HoverLinkOverlay as={RouterLink} to={link} />
    </Flex>
  );
}

export default memo(ZapGroup);
