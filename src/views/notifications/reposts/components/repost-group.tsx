import { AvatarGroup, Flex, LinkBox, Text } from "@chakra-ui/react";
import { getSharedEventPointer, getTagValue, naddrEncode, neventEncode } from "applesauce-core/helpers";
import { getEmbededSharedEvent } from "applesauce-core/helpers/share";
import { useEffect, useMemo } from "react";

import { RepostGroup as RepostGroupType } from "..";
import HoverLinkOverlay from "../../../../components/hover-link-overlay";
import RouterLink from "../../../../components/router-link";
import Timestamp from "../../../../components/timestamp";
import UserAvatarLink from "../../../../components/user/user-avatar-link";
import UserName from "../../../../components/user/user-name";
import useSingleEvent from "../../../../hooks/use-single-event";
import { eventStore } from "../../../../services/event-store";

export default function RepostGroup({ group }: { group: RepostGroupType }) {
  // Get the shared event
  const firstShareEvent = group.events[0];
  const wrappedEvent = useMemo(() => getEmbededSharedEvent(firstShareEvent), [firstShareEvent.content]);

  // Add the wrapped event to the event store
  useEffect(() => {
    if (wrappedEvent) eventStore.add(wrappedEvent);
  }, [wrappedEvent]);

  // Try to load the shared event
  const eventPointer = useMemo(() => getSharedEventPointer(firstShareEvent), [firstShareEvent]);
  const loaded = useSingleEvent(eventPointer);
  const sharedEvent = wrappedEvent || loaded;

  // Get all unique sharers
  const allSharers = useMemo(() => {
    const sharerSet = new Set<string>();
    for (const shareEvent of group.events) {
      sharerSet.add(shareEvent.pubkey);
    }
    return Array.from(sharerSet);
  }, [group.events]);

  const totalSharers = allSharers.length;
  const maxAvatarsToShow = 10;
  const visibleSharers = allSharers.slice(0, maxAvatarsToShow);
  const hiddenCount = Math.max(0, totalSharers - maxAvatarsToShow);

  const link = useMemo(() => {
    if (group.addressPointer) return `/l/${naddrEncode(group.addressPointer)}`;
    return `/l/${neventEncode(group.eventPointer)}`;
  }, [group]);

  return (
    <Flex as={LinkBox} direction="column" overflow="hidden" p="2" gap="2">
      {/* Shared Note */}
      {sharedEvent ? (
        <Flex overflow="hidden" alignItems="center" gap="2">
          <UserName pubkey={sharedEvent.pubkey} fontWeight="bold" />
          <Text fontSize="sm" color="TextGray" isTruncated flex={1}>
            {getTagValue(sharedEvent, "title") || sharedEvent.content}
          </Text>
          <Timestamp timestamp={group.latest} />
        </Flex>
      ) : (
        <Text color="TextGray">Loading reposted note...</Text>
      )}

      {/* Summary Line */}
      <Flex gap="2" alignItems="center" flexWrap="wrap" cursor="pointer">
        <AvatarGroup size="sm" max={maxAvatarsToShow}>
          {visibleSharers.map((pubkey) => (
            <UserAvatarLink key={pubkey} pubkey={pubkey} size="sm" showNip05={false} />
          ))}
        </AvatarGroup>
        {totalSharers === 1 ? (
          <Text fontWeight="medium">
            <UserName pubkey={allSharers[0]} fontWeight="bold" /> reposted
          </Text>
        ) : (
          <>
            <Text fontWeight="medium">{totalSharers} users reposted</Text>
            {hiddenCount > 0 && <Text color="gray.500">and {hiddenCount} more</Text>}
          </>
        )}
      </Flex>

      <HoverLinkOverlay as={RouterLink} to={link} />
    </Flex>
  );
}
