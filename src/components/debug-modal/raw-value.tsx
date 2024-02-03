import { Box, Code, Flex, Heading } from "@chakra-ui/react";
import { CopyIconButton } from "../copy-icon-button";

export default function RawValue({ value, heading }: { heading: string; value?: string | null }) {
  return (
    <Box>
      <Heading size="sm" mb="2">
        {heading}
      </Heading>
      <Flex gap="2">
        <Code fontSize="md" wordBreak="break-all">
          {value}
        </Code>
        <CopyIconButton text={String(value)} size="xs" aria-label="copy" />
      </Flex>
    </Box>
  );
}
