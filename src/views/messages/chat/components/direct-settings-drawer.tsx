import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  Heading,
  Link,
  Text,
  VStack,
} from "@chakra-ui/react";
import { isLegacyMessageLocked, unlockLegacyMessage } from "applesauce-core/helpers";
import { useActiveAccount, useEventModel } from "applesauce-react/hooks";

import RelayFavicon from "../../../../components/relay/relay-favicon";
import RelayStatusBadge from "../../../../components/relays/relay-status";
import RouterLink from "../../../../components/router-link";
import UserAvatarLink from "../../../../components/user/user-avatar-link";
import UserDnsIdentity from "../../../../components/user/user-dns-identity";
import UserLink from "../../../../components/user/user-link";
import UserName from "../../../../components/user/user-name";
import { useUserInbox } from "../../../../hooks/use-user-mailboxes";
import { DirectMessageRelays } from "../../../../models/messages";
import InboxesStatusSection from "../../components/inboxes-status-section";
import { LegacyMessagesGroup } from "applesauce-core/models";
import useAsyncAction from "../../../../hooks/use-async-action";
import { useMemo } from "react";
import RelayLink from "../../../../components/relay/relay-link";

function ConversationHeader({ other }: { other: string }) {
  return (
    <Flex gap="2" alignItems="flex-start">
      <UserAvatarLink pubkey={other} size="lg" />
      <Flex direction="column" overflow="hidden">
        <UserLink pubkey={other} fontSize="xl" fontWeight="bold" />
        <UserDnsIdentity pubkey={other} />
      </Flex>
    </Flex>
  );
}

function ConversationRelay({ relay }: { relay: string }) {
  return (
    <Flex gap="2" alignItems="center" w="full" overflow="hidden">
      <RelayFavicon relay={relay} size="xs" />
      <RelayLink relay={relay} isTruncated />
      <RelayStatusBadge relay={relay} ms="auto" />
    </Flex>
  );
}

function WrappedMessagesSection({ messageInboxes }: { messageInboxes: string[] }) {
  return (
    <VStack spacing={2} align="stretch">
      <Box>
        <Heading size="md">Wrapped messages</Heading>
        <Text color="GrayText">
          Your inbox relays for receiving wrapped messages (
          <Link isExternal href="https://github.com/nostr-protocol/nips/blob/master/17.md" color="blue.500">
            NIP-17
          </Link>
          ).
        </Text>
      </Box>
      {messageInboxes.length > 0 ? (
        <InboxesStatusSection relays={messageInboxes} />
      ) : (
        <Alert status="warning">
          <AlertIcon />
          <Box>
            <Text>You don't have any message inboxes configured.</Text>
            <Link as={RouterLink} to="/settings/messages" color="blue.500">
              Set up your message inboxes →
            </Link>
          </Box>
        </Alert>
      )}
    </VStack>
  );
}

function LegacyMessagesSection({
  other,
  userLegacyInboxes,
  otherLegacyInboxes,
}: {
  other: string;
  userLegacyInboxes: string[];
  otherLegacyInboxes: string[];
}) {
  const account = useActiveAccount()!;
  const messages = useEventModel(LegacyMessagesGroup, [account.pubkey, other]);

  // Action to decrypt all messages
  const decryptAll = useAsyncAction(async () => {
    if (!messages) return;

    for (const message of messages) {
      if (isLegacyMessageLocked(message)) {
        unlockLegacyMessage(message, account.pubkey, account);
      }
    }
  }, [messages, account]);

  const locked = useMemo(() => {
    if (!messages) return [];
    return messages.filter(isLegacyMessageLocked);
  }, [messages]);

  return (
    <VStack spacing={4} align="stretch">
      <Box>
        <Heading size="md">Legacy messages</Heading>
        <Text color="GrayText">
          The legacy direct messages{" "}
          <Link isExternal href="https://github.com/nostr-protocol/nips/blob/master/04.md" color="blue.500">
            NIP-04
          </Link>{" "}
          relies on the inbox relays in{" "}
          <Link isExternal href="https://github.com/nostr-protocol/nips/blob/master/65.md" color="blue.500">
            NIP-65
          </Link>
        </Text>
      </Box>

      <VStack spacing={2} align="stretch">
        <Box>
          <Heading size="sm">Your inboxes</Heading>
          <Text color="GrayText" fontSize="sm">
            Relays you use to receive messages.
          </Text>
        </Box>
        {userLegacyInboxes.length > 0 ? (
          userLegacyInboxes.map((relay) => <ConversationRelay key={relay} relay={relay} />)
        ) : (
          <Text fontSize="sm" color="GrayText">
            No legacy inboxes configured.
          </Text>
        )}
      </VStack>

      <VStack spacing={2} align="stretch">
        <Box>
          <Heading size="sm">
            <UserName pubkey={other} />
            's inboxes
          </Heading>
          <Text color="GrayText" fontSize="sm">
            Relays that <UserName pubkey={other} /> uses to receive messages.
          </Text>
        </Box>
        {otherLegacyInboxes.length > 0 ? (
          otherLegacyInboxes.map((relay) => <ConversationRelay key={relay} relay={relay} />)
        ) : (
          <Text fontSize="sm" color="GrayText">
            No legacy inboxes configured.
          </Text>
        )}
      </VStack>

      <VStack spacing={2} align="stretch">
        <Box>
          <Heading size="sm">Message Statistics</Heading>
          <Text fontSize="sm">Total legacy messages: {messages?.length || 0}</Text>
          <Text fontSize="sm">Encrypted messages: {locked.length}</Text>
        </Box>
        {locked.length > 0 && (
          <Box display="flex" justifyContent="flex-end">
            <Button
              size="sm"
              colorScheme="blue"
              onClick={decryptAll.run}
              isLoading={decryptAll.loading}
              loadingText="Decrypting..."
            >
              Decrypt All
            </Button>
          </Box>
        )}
      </VStack>
    </VStack>
  );
}

interface InfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  otherUserPubkey: string;
}

export default function DirectMessageSettingsDrawer({ isOpen, onClose, otherUserPubkey }: InfoDrawerProps) {
  const account = useActiveAccount()!;
  const legacyInboxes = useUserInbox(account.pubkey);
  const messageInboxes = useEventModel(DirectMessageRelays, [account.pubkey]);
  const otherLegacyInboxes = useUserInbox(otherUserPubkey);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader p="4">Settings</DrawerHeader>
        <DrawerBody gap="6" display="flex" flexDirection="column" px="4" pb="8" pt="0">
          <ConversationHeader other={otherUserPubkey} />

          <WrappedMessagesSection messageInboxes={messageInboxes || []} />

          <LegacyMessagesSection
            other={otherUserPubkey}
            userLegacyInboxes={legacyInboxes || []}
            otherLegacyInboxes={otherLegacyInboxes || []}
          />
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
