import { Box, ButtonGroup, Flex } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { ReactNode } from "react";

import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import useEventReactions from "../../hooks/use-event-reactions";
import EventReactionButtons from "../event-reactions/event-reactions";
import Timestamp from "../timestamp";
import UserLink from "../user/user-link";

export type MessageSlackProps = {
  message: NostrEvent;
  showHeader?: boolean;
  renderContent: (message: NostrEvent) => ReactNode;
  renderActions?: (message: NostrEvent, onReply?: (message: NostrEvent) => void) => ReactNode;
};

export default function MessageSlack({ message, showHeader = true, renderContent, renderActions }: MessageSlackProps) {
  const reactions = useEventReactions(message) ?? [];
  const hasReactions = reactions.length > 0;
  const ref = useEventIntersectionRef(message);

  return (
    <Box ref={ref} position="relative" width="full">
      {/* Quick Actions - float right in message */}
      {renderActions && (
        <Box
          className="message-actions"
          opacity="0"
          transition="opacity 0.1s ease"
          float="right"
          ml="2"
          mt="-1"
          mr="-1"
        >
          {renderActions(message)}
        </Box>
      )}

      {showHeader && (
        <Flex align="flex-start" gap="2">
          <UserLink pubkey={message.pubkey} fontWeight="bold" />
          <Timestamp timestamp={message.created_at} fontSize="sm" color="GrayText" />
        </Flex>
      )}

      {renderContent(message)}

      {hasReactions && (
        <ButtonGroup size="xs" variant="outline" spacing="2">
          <EventReactionButtons event={message} />
        </ButtonGroup>
      )}
    </Box>
  );
}
