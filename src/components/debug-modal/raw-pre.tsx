import { Box, Code, Flex, Heading } from "@chakra-ui/react";

export default function RawPre({ value, heading }: { heading: string; value: string }) {
  return (
    <Box>
      <Heading size="sm" mb="2">
        {heading}
      </Heading>
      <Flex gap="2">
        <Code whiteSpace="pre" overflowX="auto" width="100%">
          {value}
        </Code>
      </Flex>
    </Box>
  );
}
