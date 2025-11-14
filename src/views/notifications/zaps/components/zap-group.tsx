import { Box, Flex, LinkBox, Text } from "@chakra-ui/react";
import {
  getTagValue,
  getZapAmount,
  getZapPayment,
  getZapSender,
  naddrEncode,
  neventEncode,
  ZapEvent,
} from "applesauce-core/helpers";
import { useMemo } from "react";

import HoverLinkOverlay from "../../../../components/hover-link-overlay";
import RouterLink from "../../../../components/router-link";
import Timestamp from "../../../../components/timestamp";
import UserAvatar from "../../../../components/user/user-avatar";
import UserName from "../../../../components/user/user-name";
import { humanReadableSats } from "../../../../helpers/lightning";
import { TZapGroup } from "../../../../helpers/nostr/zaps";
import useEventIntersectionRef from "../../../../hooks/use-event-intersection-ref";
import useReplaceableEvent from "../../../../hooks/use-replaceable-event";
import useSingleEvent from "../../../../hooks/use-single-event";

function ZapBubble({ zap }: { zap: ZapEvent }) {
  const sender = getZapSender(zap);
  const amount = getZapAmount(zap);

  return (
    <Box display="flex" alignItems="center" gap="2">
      <UserAvatar pubkey={sender} size="sm" showNip05={false} />
      <Text fontWeight="bold">{humanReadableSats(amount / 1000)}</Text>
    </Box>
  );
}

export default function ZapGroup({ group }: { group: TZapGroup }) {
  // Try to load the zapped event
  const singleEvent = useSingleEvent(group.eventPointer);
  const replaceableEvent = useReplaceableEvent(group.addressPointer);
  const event = replaceableEvent || singleEvent;
  const ref = useEventIntersectionRef(group.events[0]);

  // Sort zaps by amount (highest first)
  const sortedZaps = useMemo(() => {
    return [...group.events].sort((a, b) => (getZapPayment(b)?.amount ?? 0) - (getZapPayment(a)?.amount ?? 0));
  }, [group.events]);

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
          <UserAvatar pubkey={getZapSender(sortedZaps[0])} size="sm" showNip05={false} />
          <Text>
            <UserName pubkey={getZapSender(sortedZaps[0])} fontWeight="bold" /> Zapped
          </Text>
          <Text fontWeight="bold">{humanReadableSats(getZapAmount(sortedZaps[0]) / 1000)}</Text>
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
