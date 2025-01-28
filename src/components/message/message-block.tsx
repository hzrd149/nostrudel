import { CardProps, Flex } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { useActiveAccount } from "applesauce-react/hooks";

import MessageBubble, { MessageBubbleProps } from "./message-bubble";
import { useThreadsContext } from "../../providers/local/thread-provider";
import ThreadButton from "./thread-button";
import UserAvatarLink from "../user/user-avatar-link";

function MessageBubbleWithThread({ message, showThreadButton = true, ...props }: MessageBubbleProps) {
  const { threads } = useThreadsContext();
  const thread = threads[message.id];

  return (
    <>
      {showThreadButton && !!thread && <ThreadButton thread={thread} />}
      <MessageBubble message={message} showThreadButton={showThreadButton && !thread} {...props} />
    </>
  );
}

export type MessageBlockProps = Omit<CardProps, "children"> & {
  messages: NostrEvent[];
  showThreadButton?: boolean;
  reverse?: boolean;
  renderContent: MessageBubbleProps["renderContent"];
};

export default function MessageBlock({
  messages,
  showThreadButton = true,
  reverse = false,
  renderContent,
}: MessageBlockProps) {
  const lastEvent = messages[messages.length - 1];
  const account = useActiveAccount()!;
  const isOwn = account.pubkey === lastEvent.pubkey;

  const avatar = <UserAvatarLink pubkey={lastEvent.pubkey} size="sm" my="1" />;

  const MessageBubbleComponent = showThreadButton ? MessageBubbleWithThread : MessageBubble;

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
      >
        {messages.map((message, i, arr) => (
          <MessageBubbleComponent
            key={message.id}
            message={message}
            showHeader={reverse ? i === arr.length - 1 : i === 0}
            minW={{ base: 0, sm: "sm", md: "md" }}
            maxW="full"
            overflow="hidden"
            showThreadButton={showThreadButton}
            renderContent={renderContent}
          />
        ))}
      </Flex>
      {isOwn && avatar}
    </Flex>
  );
}
