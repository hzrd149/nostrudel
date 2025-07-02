import { Box, ButtonGroup, Flex, FlexProps } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { ReactNode, useState } from "react";

import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import useEventReactions from "../../hooks/use-event-reactions";
import EventReactionButtons from "../event-reactions/event-reactions";
import Timestamp from "../timestamp";
import UserAvatarLink from "../user/user-avatar-link";
import UserLink from "../user/user-link";

export type MessageProps = Omit<FlexProps, "children"> & {
  message: NostrEvent;
  showHeader?: boolean;
  renderContent: (message: NostrEvent) => ReactNode;
  renderActions?: (message: NostrEvent, onReply?: (message: NostrEvent) => void) => ReactNode;
};

export default function Message({ message, showHeader = true, renderContent, renderActions, ...props }: MessageProps) {
  const reactions = useEventReactions(message) ?? [];
  const hasReactions = reactions.length > 0;
  const ref = useEventIntersectionRef(message);
  const [hover, setHover] = useState(false);

  return (
    <Flex
      ref={ref}
      position="relative"
      width="full"
      transition="background-color 0.1s ease"
      _hover={{
        bg: "var(--chakra-colors-card-hover-overlay)",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      minH="24.5px"
      gap={2}
      p={1}
      {...props}
    >
      {/* Quick Actions - float right in message */}
      {hover && renderActions && (
        <Box
          className="message-actions"
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

      <Box flexShrink={0} w="10" overflow="hidden">
        {showHeader ? (
          <UserAvatarLink pubkey={message.pubkey} size="sm" m="1" />
        ) : hover ? (
          <Timestamp timestamp={message.created_at} fontSize="sm" color="GrayText" isTruncated />
        ) : null}
      </Box>

      <Box flex={1}>
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
    </Flex>
  );
}
