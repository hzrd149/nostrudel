import { Box, Code, Heading } from "@chakra-ui/react";
import { CopyIconButton } from "../copy-icon-button";

export default function RawValue({ value, heading }: { heading: string; value?: string | null }) {
  return (
    <Box>
      <Heading size="sm" mb="2">
        {heading}
      </Heading>
      <Code py="1" pl="2" fontSize="md" wordBreak="break-all" userSelect="all" fontFamily="monospace" rounded="md">
        <CopyIconButton value={String(value)} size="sm" aria-label="copy" variant="ghost" float="right" ml="2" />
        {value}
      </Code>
    </Box>
  );
}
