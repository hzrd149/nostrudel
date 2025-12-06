import { Flex, FlexProps, LinkBox, Text } from "@chakra-ui/react";
import { getSeenRelays, neventEncode } from "applesauce-core/helpers";
import { useActiveAccount } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { memo, useMemo } from "react";

import { CompactNoteContent } from "../../../../components/compact-note-content";
import HoverLinkOverlay from "../../../../components/hover-link-overlay";
import RouterLink from "../../../../components/router-link";
import Timestamp from "../../../../components/timestamp";
import UserAvatar from "../../../../components/user/user-avatar";
import UserName from "../../../../components/user/user-name";
import useEvent from "../../../../hooks/use-event";
import useEventIntersectionRef from "../../../../hooks/use-event-intersection-ref";
import { getReplyPointer } from "../../../../services/notifications/threads";

function ParentPreview({ event, ...props }: { event: NostrEvent } & Omit<FlexProps, "children">) {
  const replyPointer = getReplyPointer(event);
  const parent = useEvent(replyPointer);
  const account = useActiveAccount();

  // Don't show if parent is not the current user's note
  if (!parent || parent.pubkey !== account?.pubkey) return null;

  return (
    <Flex gap="2" fontSize="sm" color="GrayText" fontStyle="italic" overflow="hidden" {...props}>
      <Text isTruncated>{parent.content}</Text>
    </Flex>
  );
}

function ReplyCard({ event }: { event: NostrEvent }) {
  const ref = useEventIntersectionRef(event);

  const link = useMemo(() => {
    return `/n/${neventEncode({ id: event.id, relays: Array.from(getSeenRelays(event) ?? []) })}`;
  }, [event.id]);

  return (
    <Flex as={LinkBox} direction="column" overflow="hidden" p="2" gap="2" ref={ref}>
      {/* Header */}
      <HoverLinkOverlay as={RouterLink} to={link} display="flex" alignItems="center" gap="2">
        <UserAvatar pubkey={event.pubkey} size="sm" showNip05={false} />
        <UserName pubkey={event.pubkey} fontWeight="bold" />
        <ParentPreview event={event} />
        <Timestamp timestamp={event.created_at} ms="auto" whiteSpace="nowrap" />
      </HoverLinkOverlay>

      {/* Reply Content */}
      <CompactNoteContent event={event} maxLength={200} noOfLines={1} whiteSpace="initial" />
    </Flex>
  );
}

export default memo(ReplyCard);
