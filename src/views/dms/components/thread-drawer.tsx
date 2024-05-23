import { useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  DrawerProps,
  Flex,
  Spinner,
  Text,
  TextProps,
} from "@chakra-ui/react";

import { NostrEvent } from "../../../types/nostr-event";
import UserAvatar from "../../../components/user/user-avatar";
import UserLink from "../../../components/user/user-link";
import DecryptPlaceholder from "./decrypt-placeholder";
import Timestamp from "../../../components/timestamp";
import { Thread, useThreadsContext } from "../../../providers/local/thread-provider";
import ThreadButton from "./thread-button";
import SendMessageForm from "./send-message-form";
import { groupMessages } from "../../../helpers/nostr/dms";
import { useDecryptionContext } from "../../../providers/global/decryption-provider";
import DirectMessageBlock from "./direct-message-block";

function MessagePreview({ message, ...props }: { message: NostrEvent } & Omit<TextProps, "children">) {
  return (
    <DecryptPlaceholder message={message} variant="link" py="4" px="6rem" zIndex={1}>
      {(plaintext) => <Text isTruncated>{plaintext}</Text>}
    </DecryptPlaceholder>
  );
}

function ThreadCard({ thread }: { thread: Thread }) {
  const latestMessage = thread.messages[thread.messages.length - 1];

  return (
    <Card>
      {thread.root && (
        <CardHeader px="2" pt="2" pb="1" gap="2" display="flex">
          <UserAvatar pubkey={thread.root.pubkey} size="xs" />
          <UserLink fontWeight="bold" pubkey={thread.root.pubkey} />
          <Timestamp timestamp={latestMessage.created_at} ml="auto" />
        </CardHeader>
      )}
      <CardBody px="2" py="1">
        {thread.root ? <MessagePreview message={thread.root} /> : <Spinner />}
      </CardBody>
      <CardFooter px="2" pb="2" pt="0">
        <ThreadButton thread={thread} />
      </CardFooter>
    </Card>
  );
}

function ListThreads() {
  const { threads } = useThreadsContext();

  const latestThreads = Object.values(threads).sort(
    (a, b) => b.messages[b.messages.length - 1].created_at - a.messages[a.messages.length - 1].created_at,
  );

  return (
    <>
      {latestThreads.map((thread) => (
        <ThreadCard key={thread.rootId} thread={thread} />
      ))}
    </>
  );
}

function ThreadMessages({ thread, pubkey }: { thread: Thread; pubkey: string }) {
  const grouped = groupMessages(thread.messages, 5, true);

  return (
    <>
      <Flex h="0" flex={1} overflowX="hidden" overflowY="scroll" direction="column" gap="2">
        {thread.root && <DirectMessageBlock messages={[thread.root]} showThreadButton={false} />}
        {grouped.map((group) => (
          <DirectMessageBlock key={group.id} messages={group.events} showThreadButton={false} />
        ))}
      </Flex>
      <SendMessageForm flexShrink={0} pubkey={pubkey} rootId={thread.rootId} />
    </>
  );
}

export default function ThreadDrawer({
  threadId,
  pubkey,
  ...props
}: Omit<DrawerProps, "children"> & { threadId: string; pubkey: string }) {
  const { threads, getRoot } = useThreadsContext();
  const { startQueue, getOrCreateContainer, addToQueue } = useDecryptionContext();

  const thread = threads[threadId];
  const [loading, setLoading] = useState(false);
  const decryptAll = async () => {
    if (!thread) return <Spinner />;

    const promises = thread.messages
      .map((message) => {
        const container = getOrCreateContainer(pubkey, message.content);
        if (container.plaintext.value === undefined) return addToQueue(container);
      })
      .filter(Boolean);

    if (thread.root) {
      const rootContainer = getOrCreateContainer(pubkey, thread.root.content);
      if (rootContainer.plaintext.value === undefined) addToQueue(rootContainer);
    }

    startQueue();

    setLoading(true);
    Promise.all(promises).finally(() => setLoading(false));
  };

  const renderContent = () => {
    if (threadId === "list") return <ListThreads />;
    if (!thread) {
      return <ThreadMessages thread={{ rootId: threadId, messages: [], root: getRoot(threadId) }} pubkey={pubkey} />;
    } else return <ThreadMessages thread={thread} pubkey={pubkey} />;
  };

  return (
    <Drawer placement="right" size="lg" {...props}>
      <DrawerOverlay />
      <DrawerContent bgColor="var(--chakra-colors-chakra-body-bg)">
        <DrawerCloseButton />
        <DrawerHeader p="2" display="flex" gap="4">
          <Text>Threads</Text>
          <Button size="sm" onClick={decryptAll} isLoading={loading}>
            Decrypt All
          </Button>
        </DrawerHeader>

        <DrawerBody px="2" pt="0" pb="2" gap="2" display="flex" flexDirection="column">
          {renderContent()}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
