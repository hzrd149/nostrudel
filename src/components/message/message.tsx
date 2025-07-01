import { Box, ButtonGroup, Flex } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { ReactNode, useState } from "react";

import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import useEventReactions from "../../hooks/use-event-reactions";
import EventReactionButtons from "../event-reactions/event-reactions";
import Timestamp from "../timestamp";
import UserLink from "../user/user-link";
import { getExpirationTimestamp } from "applesauce-core/helpers";

export type MessageProps = {
  message: NostrEvent;
  showHeader?: boolean;
  renderContent: (message: NostrEvent) => ReactNode;
  renderActions?: (message: NostrEvent, onReply?: (message: NostrEvent) => void) => ReactNode;
};

export default function Message({ message, showHeader = true, renderContent, renderActions }: MessageProps) {
  const reactions = useEventReactions(message) ?? [];
  const hasReactions = reactions.length > 0;
  const ref = useEventIntersectionRef(message);
  const [hover, setHover] = useState(false);

  const expirationTimestamp = getExpirationTimestamp(message);

  return (
    <Box
      ref={ref}
      position="relative"
      width="full"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      minH="24.5px"
    >
      {/* Quick Actions - float right in message */}
      {hover && renderActions && (
        <Box
          className="message-actions"
          opacity="0"
          transition="opacity 0.1s ease"
          position="absolute"
          top="-4"
          right="0"
          borderWidth={1}
          borderRadius="md"
          bg="var(--chakra-colors-chakra-body-bg)"
          px="2"
          py="1"
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

      {expirationTimestamp && (
        <Flex align="center" gap="1" mt="1">
          <Timestamp timestamp={expirationTimestamp} fontSize="xs" color="orange.500" prefix="Expires: " />
        </Flex>
      )}

      {hasReactions && (
        <ButtonGroup size="xs" variant="outline" spacing="2">
          <EventReactionButtons event={message} />
        </ButtonGroup>
      )}
    </Box>
  );
}
