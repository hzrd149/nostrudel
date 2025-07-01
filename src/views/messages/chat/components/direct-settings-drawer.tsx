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
import { useActiveAccount } from "applesauce-react/hooks";
import RelayFavicon from "../../../../components/relay-favicon";
import RelayStatusBadge from "../../../../components/relays/relay-status";
import RouterLink from "../../../../components/router-link";
import UserAvatarLink from "../../../../components/user/user-avatar-link";
import UserDnsIdentity from "../../../../components/user/user-dns-identity";
import UserLink from "../../../../components/user/user-link";
import UserName from "../../../../components/user/user-name";
import useUserMailboxes from "../../../../hooks/use-user-mailboxes";

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
      <Link as={RouterLink} to={`/relays/${encodeURIComponent(relay)}`} isTruncated>
        {relay}
      </Link>
      <RelayStatusBadge relay={relay} ms="auto" />
    </Flex>
  );
}

interface InfoDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  otherUserPubkey: string;
}

export default function DirectMessageSettingsDrawer({ isOpen, onClose, otherUserPubkey }: InfoDrawerProps) {
  const account = useActiveAccount()!;
  const userMailboxes = useUserMailboxes(account.pubkey);
  const otherUserMailboxes = useUserMailboxes(otherUserPubkey);

  const userInboxes = new Set(userMailboxes?.inboxes || []);
  const otherUserInboxes = new Set(otherUserMailboxes?.inboxes || []);

  // Group relays by their relationship type
  const sharedInboxes = Array.from(userInboxes).filter((relay) => otherUserInboxes.has(relay));
  const yourInboxes = Array.from(userInboxes).filter((relay) => !otherUserInboxes.has(relay));
  const theirInboxes = Array.from(otherUserInboxes).filter((relay) => !userInboxes.has(relay));

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Conversation Info</DrawerHeader>
        <DrawerBody gap="6" display="flex" flexDirection="column" px="4" pb="8" pt="0">
          <ConversationHeader other={otherUserPubkey} />

          {sharedInboxes.length > 0 && (
            <VStack spacing={2} align="stretch">
              <Box>
                <Heading size="md">Shared Inboxes</Heading>
                <Text color="GrayText">
                  Relays that both you and <UserName pubkey={otherUserPubkey} fontWeight="normal" /> use for receiving
                  messages
                </Text>
              </Box>
              {sharedInboxes.map((relay) => (
                <ConversationRelay key={relay} relay={relay} />
              ))}
            </VStack>
          )}

          <VStack spacing={2} align="stretch">
            <Box>
              <Heading size="md">Your Inboxes</Heading>
              <Text color="GrayText">Relays that only you use for receiving messages</Text>
            </Box>
            {yourInboxes.map((relay) => (
              <ConversationRelay key={relay} relay={relay} />
            ))}
            {userInboxes.size === 0 && (
              <Alert status="warning">
                <AlertIcon />
                You do not have any inboxes configured.{" "}
                <Link as={RouterLink} to="/settings/mailboxes">
                  Configure your inboxes
                </Link>
              </Alert>
            )}
          </VStack>

          <VStack spacing={2} align="stretch">
            <Box>
              <Heading size="md">
                <UserName pubkey={otherUserPubkey} />
                's Inboxes
              </Heading>
              <Text color="GrayText">
                Relays that only <UserName pubkey={otherUserPubkey} fontWeight="normal" /> uses for receiving messages
              </Text>
            </Box>
            {theirInboxes.map((relay) => (
              <ConversationRelay key={relay} relay={relay} />
            ))}
            {otherUserInboxes.size === 0 && (
              <Alert status="warning">
                <AlertIcon />
                The other user does not have any inboxes configured. Your messages might not be delivered.
              </Alert>
            )}
          </VStack>

          {sharedInboxes.length === 0 && yourInboxes.length === 0 && theirInboxes.length === 0 && (
            <Text color="GrayText" textAlign="center">
              No relay information available
            </Text>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
