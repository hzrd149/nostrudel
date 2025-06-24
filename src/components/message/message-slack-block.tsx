import { Box, Flex } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import UserAvatarLink from "../user/user-avatar-link";
import MessageSlack, { MessageSlackProps } from "./message-slack";

export type MessageSlackBlockProps = {
  messages: NostrEvent[];
  reverse?: boolean;
  renderContent: MessageSlackProps["renderContent"];
  renderActions?: MessageSlackProps["renderActions"];
};

export default function MessageSlackBlock({
  messages,
  reverse = false,
  renderContent,
  renderActions,
}: MessageSlackBlockProps) {
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
      px="3"
      py="2"
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
            <MessageSlack
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
