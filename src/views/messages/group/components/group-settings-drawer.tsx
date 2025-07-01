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
import { useActiveAccount, useEventModel } from "applesauce-react/hooks";
import { getConversationParticipants } from "applesauce-core/helpers";
import RelayFavicon from "../../../../components/relay-favicon";
import RelayStatusBadge from "../../../../components/relays/relay-status";
import RouterLink from "../../../../components/router-link";
import UserAvatarLink from "../../../../components/user/user-avatar-link";
import UserDnsIdentity from "../../../../components/user/user-dns-identity";
import UserLink from "../../../../components/user/user-link";
import UserName from "../../../../components/user/user-name";
import { GroupMessageInboxes } from "../../../../models/messages";

function ParticipantHeader({ pubkey }: { pubkey: string }) {
  return (
    <Flex gap="2" alignItems="flex-start">
      <UserAvatarLink pubkey={pubkey} size="md" />
      <Flex direction="column" overflow="hidden">
        <UserLink pubkey={pubkey} fontSize="lg" fontWeight="bold" />
        <UserDnsIdentity pubkey={pubkey} />
      </Flex>
    </Flex>
  );
}

function RelayItem({ relay }: { relay: string }) {
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

function ParticipantSection({
  pubkey,
  relays,
  isCurrentUser,
}: {
  pubkey: string;
  relays?: string[];
  isCurrentUser: boolean;
}) {
  return (
    <VStack spacing={2} align="stretch">
      <ParticipantHeader pubkey={pubkey} />

      {relays && relays.length > 0 ? (
        <VStack spacing={2} align="stretch">
          {relays.map((relay) => (
            <RelayItem key={relay} relay={relay} />
          ))}
        </VStack>
      ) : (
        <Alert status="warning" size="sm">
          <AlertIcon />
          <Text fontSize="sm">
            {isCurrentUser ? (
              <>
                You do not have any direct message relays configured.{" "}
                <Link as={RouterLink} to="/settings/mailboxes">
                  Configure your relays
                </Link>
              </>
            ) : (
              <>
                <UserName pubkey={pubkey} /> does not have direct message relays configured. Messages might not be
                delivered.
              </>
            )}
          </Text>
        </Alert>
      )}
    </VStack>
  );
}

interface GroupSettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  group: string;
}

export default function GroupSettingsDrawer({ isOpen, onClose, group }: GroupSettingsDrawerProps) {
  const account = useActiveAccount()!;
  const participants = getConversationParticipants(group);
  const groupInboxes = useEventModel(GroupMessageInboxes, [group]);

  // Filter out current user and get other participants
  const others = participants.filter((p) => p !== account.pubkey);
  const currentUserRelays = groupInboxes?.[account.pubkey];

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Group Settings</DrawerHeader>
        <DrawerBody gap="6" display="flex" flexDirection="column" px="4" pb="8" pt="0">
          <ParticipantSection pubkey={account.pubkey} relays={currentUserRelays} isCurrentUser={true} />
          {others.map((pubkey) => (
            <ParticipantSection key={pubkey} pubkey={pubkey} relays={groupInboxes?.[pubkey]} isCurrentUser={false} />
          ))}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
