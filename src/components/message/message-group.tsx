import { Box, Flex } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import UserAvatarLink from "../user/user-avatar-link";
import Message, { MessageProps } from "./message";

export type MessageGroupProps = {
  messages: NostrEvent[];
  reverse?: boolean;
  renderContent: MessageProps["renderContent"];
  renderActions?: MessageProps["renderActions"];
};

export default function MessagesGroup({ messages, reverse = false, renderContent, renderActions }: MessageGroupProps) {
  const lastEvent = messages[messages.length - 1];

  return (
    <Box
      width="full"
      _hover={{
        bg: "var(--chakra-colors-card-hover-overlay)",
        "& .message-actions": { opacity: 1 },
      }}
      transition="background-color 0.1s ease"
      borderRadius="md"
      p="2"
      position="relative"
    >
      <Flex direction="row" gap="2" alignItems="flex-start" width="100%">
        {/* Avatar - shown only once per message group */}
        <Box flexShrink={0}>
          <UserAvatarLink pubkey={lastEvent.pubkey} size="sm" />
        </Box>

        {/* Messages container */}
        <Flex direction={reverse ? "column-reverse" : "column"} gap="2" flex={1}>
          {messages.map((message, i, arr) => (
            <Message
              key={message.id}
              message={message}
              showHeader={reverse ? i === arr.length - 1 : i === 0}
              renderContent={renderContent}
              renderActions={renderActions}
            />
          ))}
        </Flex>
      </Flex>
    </Box>
  );
}
