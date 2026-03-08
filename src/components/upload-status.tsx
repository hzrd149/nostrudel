import { Box, Flex, Spinner, Text } from "@chakra-ui/react";

import { useUploadContext } from "../providers/local/upload-provider";
import { CheckIcon, ErrorIcon } from "./icons";

function truncateFileName(name: string, maxLen = 30) {
  if (name.length <= maxLen) return name;
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
  return name.slice(0, maxLen - ext.length - 3) + "…" + ext;
}

export default function UploadStatus() {
  const ctx = useUploadContext();
  if (!ctx || ctx.uploads.length === 0) return null;

  return (
    <Flex direction="column" gap="1">
      {ctx.uploads.map((entry) => (
        <Flex key={entry.id} align="center" gap="2" px="2" py="1" borderRadius="md" bg="whiteAlpha.100" fontSize="sm">
          {entry.status === "queued" || entry.status === "uploading" ? (
            <Spinner size="xs" color="primary.300" flexShrink={0} />
          ) : entry.status === "done" ? (
            <Box color="green.400" flexShrink={0}>
              <CheckIcon boxSize="0.9em" />
            </Box>
          ) : (
            <Box color="red.400" flexShrink={0}>
              <ErrorIcon boxSize="0.9em" />
            </Box>
          )}

          <Text noOfLines={1} flex={1} isTruncated>
            {truncateFileName(entry.file.name)}
          </Text>

          <Text color="gray.400" flexShrink={0} whiteSpace="nowrap">
            {entry.status === "queued" && "Queued"}
            {entry.status === "uploading" && "Uploading…"}
            {entry.status === "done" && "Done"}
            {entry.status === "error" && (entry.error ?? "Failed")}
          </Text>
        </Flex>
      ))}
    </Flex>
  );
}
