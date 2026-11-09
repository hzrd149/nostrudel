import {
  Alert,
  AlertIcon,
  Box,
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
import { isLegacyMessageUnlocked } from "applesauce-common/helpers";
import { useActiveAccount, useEventModel, use$ } from "applesauce-react/hooks";

import RelayFavicon from "../../../../components/relay/relay-favicon";
import RelayStatusBadge from "../../../../components/relays/relay-status";
import RouterLink from "../../../../components/router-link";
import UserAvatarLink from "../../../../components/user/user-avatar-link";
import UserDnsIdentity from "../../../../components/user/user-dns-identity";
import UserLink from "../../../../components/user/user-link";
import InboxDisclosure from "../../components/inbox-disclosure";
import { useUserInbox } from "../../../../hooks/use-user-mailboxes";
import { DirectMessageRelaysModel } from "../../../../models/messages";
import InboxesStatusSection from "../../components/inboxes-status-section";
import useMessaging from "../../../../hooks/use-messaging";
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

function WrappedMessagesSection({
  messageInboxes,
  otherInboxes,
}: {
  messageInboxes: string[];
  otherInboxes: string[];
}) {
  return (
    <VStack spacing={2} align="stretch">
      <Box>
        <Heading size="md">Wrapped messages</Heading>
      </Box>
      <InboxDisclosure label="Your inboxes">
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
      </InboxDisclosure>
      {otherInboxes.length > 0 && (
        <InboxDisclosure label="Their inboxes">
          <VStack spacing={2} align="stretch">
            {otherInboxes.map((relay) => (
              <ConversationRelay key={relay} relay={relay} />
            ))}
          </VStack>
        </InboxDisclosure>
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
  const session = useMessaging();
  const messages = use$(() => session?.legacy.conversation(other).messages$, [session, other]);

  const locked = useMemo(() => {
    if (!messages) return [];
    return messages.filter((m) => isLegacyMessageUnlocked(m) === false);
  }, [messages]);

  return (
    <VStack spacing={4} align="stretch">
      <Box>
        <Heading size="md">Legacy messages</Heading>
      </Box>

      <InboxDisclosure label="Your inboxes">
        <VStack spacing={2} align="stretch">
          {userLegacyInboxes.length > 0 ? (
            userLegacyInboxes.map((relay) => <ConversationRelay key={relay} relay={relay} />)
          ) : (
            <Text fontSize="sm" color="GrayText">
              No legacy inboxes configured.
            </Text>
          )}
        </VStack>
      </InboxDisclosure>

      <InboxDisclosure label="Their inboxes">
        <VStack spacing={2} align="stretch">
          {otherLegacyInboxes.length > 0 ? (
            otherLegacyInboxes.map((relay) => <ConversationRelay key={relay} relay={relay} />)
          ) : (
            <Text fontSize="sm" color="GrayText">
              No legacy inboxes configured.
            </Text>
          )}
        </VStack>
      </InboxDisclosure>

      <VStack spacing={2} align="stretch">
        <Box>
          <Heading size="sm">Message Statistics</Heading>
          <Text fontSize="sm">Total legacy messages: {messages?.length || 0}</Text>
          <Text fontSize="sm">Encrypted messages: {locked.length}</Text>
        </Box>
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
  const messageInboxes = useEventModel(DirectMessageRelaysModel, [account.pubkey]);
  const otherLegacyInboxes = useUserInbox(otherUserPubkey);
  const otherMessageInboxes = useEventModel(DirectMessageRelaysModel, [otherUserPubkey]);

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader p="4">Settings</DrawerHeader>
        <DrawerBody gap="6" display="flex" flexDirection="column" px="4" pb="8" pt="0">
          <ConversationHeader other={otherUserPubkey} />

          <WrappedMessagesSection messageInboxes={messageInboxes || []} otherInboxes={otherMessageInboxes || []} />

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
