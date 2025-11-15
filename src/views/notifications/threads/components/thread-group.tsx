import { AvatarGroup, Flex, LinkBox, Text } from "@chakra-ui/react";
import { neventEncode, naddrEncode, getTagValue, isAddressPointer } from "applesauce-core/helpers";
import { memo, useMemo } from "react";

import HoverLinkOverlay from "../../../../components/hover-link-overlay";
import RouterLink from "../../../../components/router-link";
import Timestamp from "../../../../components/timestamp";
import UserAvatarLink from "../../../../components/user/user-avatar-link";
import UserName from "../../../../components/user/user-name";
import useSingleEvent from "../../../../hooks/use-single-event";
import useEventIntersectionRef from "../../../../hooks/use-event-intersection-ref";
import useReplaceableEvent from "../../../../hooks/use-replaceable-event";
import { ThreadGroupData } from "../helpers";

function ThreadGroup({ group }: { group: ThreadGroupData }) {
  const ref = useEventIntersectionRef(group.replies[0]);

  // Try to load the thread root event
  const rootEvent = isAddressPointer(group.rootPointer)
    ? useReplaceableEvent(group.rootPointer)
    : useSingleEvent(group.rootPointer);

  // Get all unique repliers
  const allRepliers = useMemo(() => {
    return group.repliers;
  }, [group.repliers]);

  const totalRepliers = allRepliers.length;
  const maxAvatarsToShow = 10;
  const visibleRepliers = allRepliers.slice(0, maxAvatarsToShow);
  const hiddenCount = Math.max(0, totalRepliers - maxAvatarsToShow);

  const link = useMemo(() => {
    if ("id" in group.rootPointer) {
      return `/l/${neventEncode(group.rootPointer)}`;
    } else {
      return `/l/${naddrEncode(group.rootPointer)}`;
    }
  }, [group.rootPointer]);

  return (
    <Flex as={LinkBox} direction="column" overflow="hidden" p="2" gap="2" ref={ref}>
      {/* Summary Line */}
      <Flex gap="2" alignItems="center" flexWrap="wrap" cursor="pointer">
        <AvatarGroup size="sm" max={maxAvatarsToShow}>
          {visibleRepliers.map((pubkey) => (
            <UserAvatarLink key={pubkey} pubkey={pubkey} size="sm" showNip05={false} />
          ))}
        </AvatarGroup>
        {totalRepliers === 1 ? (
          <Text fontWeight="medium">
            <UserName pubkey={allRepliers[0]} fontWeight="bold" /> replied in this thread
          </Text>
        ) : (
          <>
            <Text fontWeight="medium">{totalRepliers} users replied in this thread</Text>
            {hiddenCount > 0 && <Text color="gray.500">and {hiddenCount} more</Text>}
          </>
        )}
      </Flex>

      {/* Thread Root */}
      {rootEvent ? (
        <HoverLinkOverlay as={RouterLink} to={link} display="flex" alignItems="center" gap="2">
          <UserName pubkey={rootEvent.pubkey} />
          <Text fontSize="sm" color="gray.500" isTruncated flex={1}>
            {getTagValue(rootEvent, "title") || rootEvent.content}
          </Text>
          <Timestamp timestamp={group.latest} />
        </HoverLinkOverlay>
      ) : (
        <Text color="gray.500">Loading thread...</Text>
      )}
    </Flex>
  );
}

export default memo(ThreadGroup);
