import {
  AvatarGroup,
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Heading,
  LinkBox,
  LinkOverlay,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from "@chakra-ui/react";
import { getGiftWrapRumor, Rumor, getConversationParticipants, isGiftWrapUnlocked } from "applesauce-common/helpers";
import { useActiveAccount, use$ } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";
import { useEffect, useMemo, useRef } from "react";
import { Link as RouterLink } from "react-router-dom";

import { UnlockIcon } from "../../../../components/icons";
import Timestamp from "../../../../components/timestamp";
import UserAvatar from "../../../../components/user/user-avatar";
import UserName from "../../../../components/user/user-name";
import useGiftWrapDecryption from "../../../../hooks/use-gift-wrap-decryption";
import useMessaging from "../../../../hooks/use-messaging";

interface GroupInfo {
  id: string;
  participants: string[];
  messageCount: number;
  latestTimestamp: number;
}

function GroupCard({ group }: { group: GroupInfo }) {
  const account = useActiveAccount()!;
  const others = group.participants.filter((p) => p !== account.pubkey);

  return (
    <LinkBox
      as={Card}
      variant="outline"
      py="3"
      px="4"
      cursor="pointer"
      _hover={{ bg: "var(--chakra-colors-card-hover-overlay)" }}
    >
      <Flex align="center" gap={4}>
        <AvatarGroup size="md" max={3}>
          {others.map((pubkey) => (
            <UserAvatar key={pubkey} pubkey={pubkey} size="md" />
          ))}
        </AvatarGroup>

        <VStack align="start" spacing={1} flex={1}>
          <Text fontSize="md">
            {others.map((pubkey, index) => (
              <span key={pubkey}>
                <UserName pubkey={pubkey} />
                {index < others.length - 1 && ", "}
              </span>
            ))}
          </Text>
          <Text fontSize="sm" color="GrayText">
            {others.length === 1 ? "Direct message" : `Group conversation (${group.participants.length} members)`}
          </Text>
        </VStack>

        <VStack align="end" spacing={1}>
          <Badge colorScheme="blue" fontSize="sm">
            {group.messageCount} new message{group.messageCount !== 1 ? "s" : ""}
          </Badge>
          <Timestamp fontSize="xs" color="GrayText" timestamp={group.latestTimestamp} />
        </VStack>
      </Flex>

      <LinkOverlay as={RouterLink} to={`/messages/${group.id}`} />
    </LinkBox>
  );
}

function MiscEventsTable({ events }: { events: Rumor[] }) {
  if (events.length === 0) return null;

  return (
    <Box>
      <Heading size="md" mb={4}>
        Misc Events ({events.length})
      </Heading>
      <TableContainer>
        <Table size="sm" variant="simple">
          <Thead>
            <Tr>
              <Th>Author</Th>
              <Th>Kind</Th>
              <Th>Created</Th>
              <Th>Content</Th>
              <Th>Tags</Th>
            </Tr>
          </Thead>
          <Tbody>
            {events.map((event, index) => (
              <Tr key={index}>
                <Td>
                  <Flex align="center" gap={2}>
                    <UserAvatar pubkey={event.pubkey} size="sm" />
                    <UserName pubkey={event.pubkey} />
                  </Flex>
                </Td>
                <Td>
                  <Badge colorScheme="gray">{event.kind}</Badge>
                </Td>
                <Td>
                  <Timestamp timestamp={event.created_at} />
                </Td>
                <Td maxW="300px">
                  <Text fontSize="sm" noOfLines={2} wordBreak="break-word">
                    {event.content || "(No content)"}
                  </Text>
                </Td>
                <Td maxW="200px">
                  <Text fontSize="xs" color="GrayText" noOfLines={2}>
                    {event.tags.map((tag: string[]) => `[${tag[0]}${tag[1] ? `:${tag[1]}` : ""}]`).join(" ")}
                  </Text>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default function LockedMessagesSection() {
  const account = useActiveAccount()!;

  // Get all gift wraps for the account
  const initiallyLockedIds = useRef<Set<string>>(new Set());
  const { locked, failed, running, decrypted, start, stop, retryFailed } = useGiftWrapDecryption();
  useEffect(() => {
    if (!locked) return;
    for (const gift of locked) initiallyLockedIds.current.add(gift.id);
  }, [locked]);

  // Get all unlocked gift wraps that were previously locked
  const session = useMessaging();
  const unlocked = use$(() => session?.wrapped.giftWraps$, [session]);
  const messages = useMemo(() => {
    if (!unlocked) return [];
    return unlocked.filter((gift) => isGiftWrapUnlocked(gift) && initiallyLockedIds.current.has(gift.id));
  }, [unlocked]);

  // Sort groups by latest message timestamp
  const groups = useMemo(() => {
    if (!messages) return [];

    const groupsMap = new Map<string, GroupInfo>();
    for (const giftWrap of messages) {
      const rumor = getGiftWrapRumor(giftWrap);
      if (!rumor || (rumor.kind !== kinds.PrivateDirectMessage && rumor.kind !== kinds.FileMessage)) continue;

      const participants = getConversationParticipants(rumor);
      const groupId = participants.filter((p) => p !== account.pubkey).join(":") || account.pubkey;

      const existing = groupsMap.get(groupId);
      if (existing) {
        existing.messageCount++;
        existing.latestTimestamp = Math.max(existing.latestTimestamp, rumor.created_at);
      } else {
        groupsMap.set(groupId, {
          id: groupId,
          participants,
          messageCount: 1,
          latestTimestamp: rumor.created_at,
        });
      }
    }

    return Array.from(groupsMap.values()).sort((a, b) => b.latestTimestamp - a.latestTimestamp);
  }, [messages]);

  // Filter out conversation messages
  const miscEvents = useMemo(() => {
    if (!messages) return [];

    return messages.flatMap((gw) => {
      const rumor = getGiftWrapRumor(gw);
      return rumor && rumor.kind !== kinds.PrivateDirectMessage && rumor.kind !== kinds.FileMessage ? [rumor] : [];
    });
  }, [messages]);

  return (
    <VStack spacing={6} align="stretch">
      {/* Summary section */}
      {(running || !!locked?.length || !!failed?.length) && (
        <Box>
          <Heading size="md" mb={3}>
            Encrypted Messages
          </Heading>
          <Card variant="outline" p={4}>
            <Flex align="center" justify="space-between" wrap="wrap" gap="2">
              <VStack align="start" spacing={1}>
                <Text fontSize="lg" fontWeight="medium">
                  {locked?.length ?? 0} encrypted message{locked?.length !== 1 ? "s" : ""}
                </Text>
                {failed && failed.length > 0 && (
                  <Text color="GrayText" fontSize="sm">
                    {failed.length} could not be decrypted.{" "}
                    <Button variant="link" onClick={retryFailed}>
                      Retry
                    </Button>
                  </Text>
                )}
              </VStack>

              {running ? (
                <Button onClick={stop} variant="ghost">
                  Stop decrypting ({decrypted} done)
                </Button>
              ) : (
                locked &&
                locked.length > 0 && (
                  <Button leftIcon={<UnlockIcon boxSize={5} />} onClick={start} colorScheme="primary">
                    Decrypt All
                  </Button>
                )
              )}
            </Flex>
          </Card>
        </Box>
      )}

      {/* Conversation groups section */}
      {groups.length > 0 && (
        <Box>
          <Heading size="md" mb={4}>
            New Messages by Conversation ({groups.length})
          </Heading>
          <VStack spacing={3} align="stretch">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </VStack>
        </Box>
      )}

      {/* Misc events section */}
      {miscEvents.length > 0 && <MiscEventsTable events={miscEvents} />}
    </VStack>
  );
}
