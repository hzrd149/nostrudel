import { Flex, LinkBox, Text } from "@chakra-ui/react";
import { isAddressPointer, neventEncode } from "applesauce-core/helpers";
import { useActiveAccount } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { AddressPointer, EventPointer } from "nostr-tools/nip19";
import { useMemo } from "react";

import { CompactNoteContent } from "../../../../components/compact-note-content";
import HoverLinkOverlay from "../../../../components/hover-link-overlay";
import RouterLink from "../../../../components/router-link";
import Timestamp from "../../../../components/timestamp";
import UserAvatar from "../../../../components/user/user-avatar";
import UserName from "../../../../components/user/user-name";
import useEventIntersectionRef from "../../../../hooks/use-event-intersection-ref";
import useReplaceableEvent from "../../../../hooks/use-replaceable-event";
import useSingleEvent from "../../../../hooks/use-single-event";

function ParentPreview({ pointer }: { pointer: EventPointer | AddressPointer }) {
  const parent = isAddressPointer(pointer) ? useReplaceableEvent(pointer) : useSingleEvent(pointer);
  const account = useActiveAccount();

  // Don't show if parent is not the current user's note
  if (!parent || parent.pubkey !== account?.pubkey) return null;

  return (
    <Flex gap="2" fontSize="sm" color="gray.500" fontStyle="italic" overflow="hidden">
      <Text flexShrink={0}>replying to you:</Text>
      <Text isTruncated>{parent.content}</Text>
    </Flex>
  );
}

export type DirectReplyData = {
  key: string;
  event: NostrEvent;
  parentPointer?: EventPointer | AddressPointer;
};

export default function DirectReplyCard({ reply }: { reply: DirectReplyData }) {
  const ref = useEventIntersectionRef(reply.event);

  const link = useMemo(() => {
    return `/n/${neventEncode({ id: reply.event.id, relays: [] })}`;
  }, [reply.event.id]);

  return (
    <Flex as={LinkBox} direction="column" overflow="hidden" p="2" gap="2" ref={ref}>
      {/* Header */}
      <HoverLinkOverlay as={RouterLink} to={link}>
        <Flex gap="2" alignItems="center" overflow="hidden">
          <UserAvatar pubkey={reply.event.pubkey} size="sm" />
          <UserName pubkey={reply.event.pubkey} fontWeight="bold" />
          {reply.parentPointer && <ParentPreview pointer={reply.parentPointer} />}
          <Timestamp timestamp={reply.event.created_at} ms="auto" />
        </Flex>
      </HoverLinkOverlay>

      {/* Reply Content */}
      <CompactNoteContent event={reply.event} maxLength={200} noOfLines={1} whiteSpace="initial" />
    </Flex>
  );
}
