import { CardProps, Flex } from "@chakra-ui/react";

import useCurrentAccount from "../../../hooks/use-current-account";
import { NostrEvent } from "../../../types/nostr-event";
import UserAvatar from "../../../components/user-avatar";
import MessageBubble, { MessageBubbleProps } from "./message-bubble";
import { useThreadsContext } from "./thread-provider";
import ThreadButton from "./thread-button";

function MessageBubbleWithThread({ message, ...props }: MessageBubbleProps) {
  const { threads } = useThreadsContext();
  const thread = threads[message.id];

  return (
    <>
      {thread && <ThreadButton thread={thread} />}
      <MessageBubble message={message} {...props} />
    </>
  );
}

export default function MessageBlock({
  messages,
  showThreadButtons = true,
  reverse = false,
}: { messages: NostrEvent[]; showThreadButtons?: boolean; reverse?: boolean } & Omit<CardProps, "children">) {
  const lastEvent = messages[messages.length - 1];
  const account = useCurrentAccount()!;
  const isOwn = account.pubkey === lastEvent.pubkey;

  const avatar = <UserAvatar pubkey={lastEvent.pubkey} size="sm" my="1" />;

  const MessageBubbleComponent = showThreadButtons ? MessageBubbleWithThread : MessageBubble;

  return (
    <Flex direction="row" gap="2" alignItems="flex-end">
      {!isOwn && avatar}
      <Flex
        direction={reverse ? "column-reverse" : "column"}
        gap="1"
        ml={isOwn ? "auto" : 0}
        mr={isOwn ? 0 : "auto"}
        maxW="2xl"
        alignItems={isOwn ? "flex-end" : "flex-start"}
        overflowX="hidden"
        overflowY="visible"
      >
        {messages.map((message, i, arr) => (
          <MessageBubbleComponent
            key={message.id}
            message={message}
            showHeader={reverse ? i === arr.length - 1 : i === 0}
            minW={{ base: 0, sm: "sm", md: "md" }}
            overflow="hidden"
          />
        ))}
      </Flex>
      {isOwn && avatar}
    </Flex>
  );
}
