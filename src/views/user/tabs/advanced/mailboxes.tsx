import { Box, Flex, Heading, Tag, Text, VStack } from "@chakra-ui/react";
import { ProfilePointer } from "nostr-tools/nip19";

import { CopyIconButton } from "../../../../components/copy-icon-button";
import { ErrorBoundary } from "../../../../components/error-boundary";
import RelayFavicon from "../../../../components/relay/relay-favicon";
import RelayLink from "../../../../components/relay/relay-link";
import { useRelayInfo } from "../../../../hooks/use-relay-info";
import useUserMailboxes from "../../../../hooks/use-user-mailboxes";

function RelayItem({ url }: { url: string }) {
  const { info } = useRelayInfo(url);

  return (
    <Flex gap="2" alignItems="center">
      <RelayFavicon relay={url} size="xs" />
      <Box overflow="hidden" isTruncated flex={1}>
        <RelayLink relay={url} fontSize="sm" isTruncated />
        {info?.description && (
          <Text fontSize="xs" color="GrayText" isTruncated>
            {info.description}
          </Text>
        )}
      </Box>
      {info?.payments_url && (
        <Tag variant="solid" colorScheme="green" size="sm">
          Paid
        </Tag>
      )}
      <CopyIconButton value={url} title="Copy relay URL" aria-label="Copy relay URL" size="xs" variant="ghost" />
    </Flex>
  );
}

export default function MailboxSection({ user }: { user: ProfilePointer }) {
  const mailboxes = useUserMailboxes(user);

  return (
    <VStack align="stretch" spacing={4}>
      {/* Inbox Relays */}
      <Box>
        <Box mb={2}>
          <Heading size="sm">Inbox Relays ({mailboxes?.inboxes.length || 0})</Heading>
          <Text fontSize="sm" color="GrayText">
            Inbox relays are used to receive messages from other users.
          </Text>
        </Box>
        {mailboxes?.inboxes.length ? (
          <VStack align="stretch">
            {Array.from(mailboxes.inboxes).map((url) => (
              <ErrorBoundary key={url}>
                <RelayItem url={url} />
              </ErrorBoundary>
            ))}
          </VStack>
        ) : (
          <Text color="gray.500" fontStyle="italic" fontSize="sm">
            No inbox relays configured
          </Text>
        )}
      </Box>

      {/* Outbox Relays */}
      <Box>
        <Box mb={2}>
          <Heading size="sm">Outbox Relays ({mailboxes?.outboxes.length || 0})</Heading>
          <Text fontSize="sm" color="GrayText">
            Outbox relays are used to send messages to other users.
          </Text>
        </Box>
        {mailboxes?.outboxes.length ? (
          <VStack align="stretch">
            {Array.from(mailboxes.outboxes).map((url) => (
              <ErrorBoundary key={url}>
                <RelayItem url={url} />
              </ErrorBoundary>
            ))}
          </VStack>
        ) : (
          <Text color="gray.500" fontStyle="italic" fontSize="sm">
            No outbox relays configured
          </Text>
        )}
      </Box>
    </VStack>
  );
}
