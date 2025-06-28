import {
  Alert,
  AlertIcon,
  AvatarGroup,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  Text,
  VStack,
} from "@chakra-ui/react";
import { getGiftWrapRumor, isGiftWrapLocked, Rumor, unlockGiftWrap } from "applesauce-core/helpers/gift-wraps";
import { getConversationParticipants } from "applesauce-core/helpers/wrapped-messages";
import { GiftWrapsModel } from "applesauce-core/models";
import { useActiveAccount, useEventModel, useEventStore } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useMemo, useRef } from "react";

import { UnlockIcon } from "../../components/icons";
import SimpleView from "../../components/layout/presets/simple-view";
import Timestamp from "../../components/timestamp";
import UserAvatar from "../../components/user/user-avatar";
import UserName from "../../components/user/user-name";
import useAsyncAction from "../../hooks/use-async-action";

function ConversationParticipants({ message }: { message: Rumor }) {
  const participants = getConversationParticipants(message);
  return (
    <Flex align="center" gap={3}>
      <AvatarGroup size="sm" max={3}>
        {participants.map((pubkey) => (
          <UserAvatar key={pubkey} pubkey={pubkey} size="sm" />
        ))}
      </AvatarGroup>
      <VStack align="start" spacing={0}>
        <Text fontSize="sm" fontWeight="medium">
          {participants.length > 2 ? "Group conversation" : "Direct message"}
        </Text>
        <Text fontSize="xs" color="gray.500">
          {participants.map((pubkey, index) => (
            <span key={pubkey}>
              <UserName pubkey={pubkey} />
              {index < participants.length - 1 && ", "}
            </span>
          ))}
        </Text>
      </VStack>
    </Flex>
  );
}

function GiftWrapTableRow({ giftWrap }: { giftWrap: NostrEvent }) {
  const account = useActiveAccount()!;

  const message = getGiftWrapRumor(giftWrap);

  const decryptMessage = useAsyncAction(async () => {
    if (!account) return;
    await unlockGiftWrap(giftWrap, account);
  }, [giftWrap, account]);

  return (
    <Card
      w="full"
      variant="outline"
      py="2"
      px="3"
      flexDir="row"
      gap="2"
      flexWrap="wrap"
      alignItems="flex-start"
      maxW="6xl"
    >
      <Flex gap="2" direction="column">
        {!message ? <Text fontWeight="bold">Encrypted message</Text> : <ConversationParticipants message={message} />}
        {message && (
          <Text fontSize="sm" noOfLines={3}>
            {message.content}
          </Text>
        )}
      </Flex>
      <Flex gap="2" align="center" ms="auto" flexShrink={0}>
        <Timestamp color="GrayText" timestamp={message?.created_at ?? giftWrap.created_at} />
        {!message && (
          <Button
            leftIcon={<UnlockIcon />}
            onClick={decryptMessage.run}
            isLoading={decryptMessage.loading}
            colorScheme="blue"
            loadingText="Decrypting..."
          >
            Unlock
          </Button>
        )}
      </Flex>
    </Card>
  );
}

export default function InboxView() {
  const account = useActiveAccount()!;
  const eventStore = useEventStore();

  // Get all gift wraps for the account
  const giftWraps = useEventModel(GiftWrapsModel, account ? [account.pubkey] : undefined);

  // Track which messages were initially locked when the view loaded
  // Use useRef to persist this across re-renders
  const initiallyLockedIds = useRef<Set<string>>(new Set());

  // Filter to only show messages that were initially locked
  const messagesToShow = useMemo(() => {
    if (!giftWraps) return [];

    // On first load, identify which messages are locked
    const currentLocked = giftWraps.filter((gw) => isGiftWrapLocked(gw));
    currentLocked.forEach((gw) => initiallyLockedIds.current.add(gw.id));

    // Return only messages that were initially locked
    return giftWraps.filter((gw) => initiallyLockedIds.current.has(gw.id));
  }, [giftWraps]);

  const lockedMessages = messagesToShow.filter((gw) => isGiftWrapLocked(gw));
  const unlockedMessages = messagesToShow.filter((gw) => !isGiftWrapLocked(gw));

  const decryptAll = useAsyncAction(async () => {
    if (!account) return;
    for (const giftWrap of lockedMessages) {
      try {
        await unlockGiftWrap(giftWrap, account);
      } catch (error) {
        console.error("Failed to decrypt gift wrap:", giftWrap.id, error);
      }
    }
  }, [lockedMessages, account, eventStore]);

  return (
    <SimpleView
      title="Message Inbox"
      actions={
        <Button
          colorScheme="primary"
          onClick={decryptAll.run}
          isLoading={decryptAll.loading}
          loadingText="Decrypting All..."
          ms="auto"
          size="sm"
        >
          Decrypt All ({lockedMessages.length})
        </Button>
      }
    >
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="md">Messages to decrypt ({lockedMessages.length})</Heading>
          <Text color="GrayText">Encrypted messages (NIP-17 Gift Wraps) that need to be decrypted</Text>
        </Box>

        {messagesToShow.length === 0 ? (
          <Alert status="info">
            <AlertIcon />
            No encrypted messages found. New encrypted messages will appear here when received.
          </Alert>
        ) : (
          <Flex gap="2" direction="column">
            {messagesToShow.map((giftWrap) => (
              <GiftWrapTableRow key={giftWrap.id} giftWrap={giftWrap} />
            ))}
          </Flex>
        )}
      </VStack>
    </SimpleView>
  );
}
