import {
  Alert,
  AlertIcon,
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
import { getConversationParticipants } from "applesauce-core/helpers";
import { useActiveAccount, useEventModel } from "applesauce-react/hooks";
import RelayFavicon from "../../../../components/relay/relay-favicon";
import RelayLink from "../../../../components/relay/relay-link";
import RouterLink from "../../../../components/router-link";
import UserAvatarLink from "../../../../components/user/user-avatar-link";
import UserLink from "../../../../components/user/user-link";
import UserName from "../../../../components/user/user-name";
import { DirectMessageRelays, GroupMessageInboxes } from "../../../../models/messages";
import InboxesStatusSection from "../../components/inboxes-status-section";

function ParticipantInboxesSection({
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
      <Flex gap="2" alignItems="center">
        <UserAvatarLink pubkey={pubkey} size="sm" />
        <UserLink pubkey={pubkey} fontSize="lg" fontWeight="bold" />
      </Flex>

      {relays && relays.length > 0 ? (
        <VStack spacing={2} align="stretch">
          {relays.map((relay) => (
            <Flex gap="2" alignItems="center" w="full" overflow="hidden" key={relay}>
              <RelayFavicon relay={relay} size="xs" />
              <RelayLink relay={relay} isTruncated />
            </Flex>
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
  const inboxes = useEventModel(DirectMessageRelays, [account.pubkey]);
  const groupInboxes = useEventModel(GroupMessageInboxes, [group]);

  // Filter out current user and get other participants
  const others = participants.filter((p) => p !== account.pubkey);
  const currentUserRelays = groupInboxes?.[account.pubkey];

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader p="4">Settings</DrawerHeader>
        <DrawerBody gap="6" display="flex" flexDirection="column" px="4" pb="8" pt="0">
          {inboxes && (
            <VStack spacing={2} align="stretch">
              <Heading size="md">Inbox relays</Heading>
              {inboxes.length > 0 ? (
                <InboxesStatusSection relays={inboxes} />
              ) : (
                <Button variant="link" as={RouterLink} to="/settings/mailboxes" colorScheme="primary">
                  Setup message inboxes
                </Button>
              )}
            </VStack>
          )}

          <VStack spacing={4} align="stretch">
            <Heading size="md">Group inboxes</Heading>
            <ParticipantInboxesSection pubkey={account.pubkey} relays={currentUserRelays} isCurrentUser={true} />
            {others.map((pubkey) => (
              <ParticipantInboxesSection
                key={pubkey}
                pubkey={pubkey}
                relays={groupInboxes?.[pubkey]}
                isCurrentUser={false}
              />
            ))}
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
