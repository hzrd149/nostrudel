import { Box, Flex, Heading, Text, VStack } from "@chakra-ui/react";

import { ProfilePointer } from "nostr-tools/nip19";
import { CopyIconButton } from "../../../../components/copy-icon-button";
import { ErrorBoundary } from "../../../../components/error-boundary";
import BlossomServerFavicon from "../../../../components/blossom/blossom-server-favicon";
import useUsersMediaServers from "../../../../hooks/use-user-blossom-servers";
import BlossomServerLink from "../../../../components/blossom/blossom-server-link";

function ServerItem({ url }: { url: URL }) {
  return (
    <Flex gap="2" alignItems="center">
      <BlossomServerFavicon server={url} size="xs" />
      <Box overflow="hidden" isTruncated flex={1}>
        <BlossomServerLink server={url} fontSize="sm" isTruncated />
      </Box>
      <CopyIconButton
        value={url.toString()}
        title="Copy server URL"
        aria-label="Copy server URL"
        size="xs"
        variant="ghost"
      />
    </Flex>
  );
}

export default function BlossomServersSection({ user }: { user: ProfilePointer }) {
  const servers = useUsersMediaServers(user);

  return (
    <VStack align="stretch" spacing={4}>
      {/* Blossom Servers */}
      <Box>
        <Box mb={2}>
          <Heading size="sm">Blossom Servers ({servers?.length || 0})</Heading>
          <Text fontSize="sm" color="GrayText">
            Blossom servers are used to store and serve media files like images and videos.
          </Text>
        </Box>
        {servers?.length ? (
          <VStack align="stretch">
            {servers.map((url) => (
              <ErrorBoundary key={url.toString()}>
                <ServerItem url={url} />
              </ErrorBoundary>
            ))}
          </VStack>
        ) : (
          <Text color="GrayText" fontStyle="italic" fontSize="sm">
            No blossom servers configured
          </Text>
        )}
      </Box>
    </VStack>
  );
}
