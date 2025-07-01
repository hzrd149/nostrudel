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
import { NostrEvent } from "nostr-tools";

import { isLegacyMessageLocked, unlockLegacyMessage } from "applesauce-core/helpers";
import { useActiveAccount } from "applesauce-react/hooks";
import ThreadButton from "../../../components/message/thread-button";
import Timestamp from "../../../components/timestamp";
import UserAvatar from "../../../components/user/user-avatar";
import UserLink from "../../../components/user/user-link";
import { groupMessages } from "../../../helpers/nostr/dms";
import useAsyncAction from "../../../hooks/use-async-action";
import { Thread, useThreadsContext } from "../../../providers/local/thread-provider";
import DecryptPlaceholder from "../chat/components/decrypt-placeholder";
import DirectMessageGroup from "./direct-message-group";
import SendMessageForm from "../chat/components/direct-message-form";

function MessagePreview({ message, ...props }: { message: NostrEvent } & Omit<TextProps, "children">) {
  return (
    <DecryptPlaceholder message={message}>
      {(plaintext) => (
        <Text isTruncated {...props}>
          {plaintext}
        </Text>
      )}
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
  const grouped = groupMessages(thread.messages, 5);

  return (
    <>
      <Flex h="0" flex={1} overflowX="hidden" overflowY="scroll" direction="column" gap="2">
        {thread.root && <DirectMessageGroup messages={[thread.root]} />}
        {grouped.map((group) => (
          <DirectMessageGroup key={group[0].id} messages={group} />
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
  const account = useActiveAccount();

  const thread = threads[threadId];
  const decryptAll = useAsyncAction(async () => {
    if (!thread || !account) return;

    // Decrypt root message
    if (thread.root) {
      await unlockLegacyMessage(thread.root, account.pubkey, account);
    }

    // Decrypt all messages
    for (const message of thread.messages) {
      if (isLegacyMessageLocked(message)) {
        await unlockLegacyMessage(message, account.pubkey, account);
      }
    }
  }, [thread, account]);

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
          <Button size="sm" onClick={decryptAll.run} isLoading={decryptAll.loading}>
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
