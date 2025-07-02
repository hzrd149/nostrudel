import { Box, Flex } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";

import Message, { MessageProps } from "./message";

export type MessageGroupProps = {
  messages: NostrEvent[];
  reverse?: boolean;
  renderContent: MessageProps["renderContent"];
  renderActions?: MessageProps["renderActions"];
};

export default function MessagesGroup({ messages, reverse = false, renderContent, renderActions }: MessageGroupProps) {
  return (
    <Flex direction={reverse ? "column-reverse" : "column"}>
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
  );
}
