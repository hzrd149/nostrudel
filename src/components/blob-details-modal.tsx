import { CheckCircleIcon, WarningIcon } from "@chakra-ui/icons";
import {
  Badge,
  Box,
  Flex,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { hasBlob } from "blossom-client-sdk/actions/has";
import { useState } from "react";
import { useAsync } from "react-use";

import useUsersMediaServers from "../hooks/use-user-blossom-servers";
import BlossomServerFavicon from "./blossom/blossom-server-favicon";

function ServerBlobStatus({ server, blob }: { server: string | URL; blob: string }) {
  const check = useAsync(() => hasBlob(server, blob), [server, blob]);

  return (
    <HStack spacing={2} width="100%">
      <BlossomServerFavicon server={server} size="xs" />
      <Text flex={1} isTruncated>
        {server.toString()}
      </Text>
      {check.loading && <Badge colorScheme="blue">Checking...</Badge>}
      {check.value === true && <Badge colorScheme="green">Available</Badge>}
      {check.value === false && <Badge colorScheme="red">Not Found</Badge>}
      {check.error && (
        <Badge colorScheme="orange" title={check.error.message}>
          Error
        </Badge>
      )}
    </HStack>
  );
}

function BlobVerificationCard({ url, hash }: { url: string; hash: string }) {
  const [downloaded, setDownloaded] = useState<string>();

  const matches = useAsync(async () => {
    const buff = await fetch(url).then((res) => res.arrayBuffer());
    const downloaded = bytesToHex(sha256.create().update(new Uint8Array(buff)).digest());
    setDownloaded(downloaded);

    return hash === downloaded;
  }, [url, hash]);

  return (
    <Flex
      p={4}
      gap="2"
      direction="column"
      borderRadius="md"
      borderWidth={2}
      borderColor={
        matches.loading ? "gray.200" : matches.error ? "red.500" : matches.value ? "green.500" : "orange.500"
      }
      position="relative"
    >
      <Flex gap="2" align="center">
        {matches.loading ? (
          <Spinner size="md" />
        ) : matches.error ? (
          <WarningIcon color="red.500" boxSize={8} />
        ) : matches.value ? (
          <CheckCircleIcon color="green.500" boxSize={8} />
        ) : (
          <WarningIcon color="orange.500" boxSize={8} />
        )}
        <Text fontWeight="bold">
          {matches.loading
            ? "Verifying..."
            : matches.error
              ? "Error Verifying"
              : matches.value
                ? "Verified"
                : "Invalid Hash"}
        </Text>
      </Flex>

      <Box>
        <Text fontSize="sm" color="GrayText">
          Original:{" "}
          <Text fontFamily="monospace" wordBreak="break-all">
            {hash}
          </Text>
        </Text>
        {downloaded && (
          <Text fontSize="sm" color="GrayText">
            Downloaded:{" "}
            <Text fontFamily="monospace" wordBreak="break-all">
              {downloaded}
            </Text>
          </Text>
        )}
        {matches.error && (
          <Text fontSize="sm" color="red.500">
            Error: {matches.error.message}
          </Text>
        )}
      </Box>
    </Flex>
  );
}

export function BlobDetailsModal({
  url,
  pubkey,
  hash,
  ...props
}: { url: string; pubkey: string; hash: string } & Omit<ModalProps, "children">) {
  const servers = useUsersMediaServers(pubkey);

  return (
    <Modal {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Details</ModalHeader>
        <ModalCloseButton />
        <ModalBody gap="2" display="flex" flexDirection="column" pt="0" pb="4">
          <BlobVerificationCard url={url} hash={hash} />

          <Box mt="4">
            <Text fontWeight="bold" mb={2}>
              Available on servers:
            </Text>
            {!servers ? (
              <Spinner size="sm" />
            ) : servers.length === 0 ? (
              <Text color="gray.500">No media servers found for this user</Text>
            ) : (
              <VStack align="stretch" spacing={2} mt={2}>
                {servers.map((server, i) => (
                  <ServerBlobStatus key={String(server)} server={server} blob={hash} />
                ))}
              </VStack>
            )}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
