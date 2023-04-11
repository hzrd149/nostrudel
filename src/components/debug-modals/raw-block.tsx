import { Box, Code, Flex, Heading } from "@chakra-ui/react";

export default function RawJson({ json, heading }: { heading: string; json: any }) {
  return (
    <Box>
      <Heading size="sm" mb="2">
        {heading}
      </Heading>
      <Flex gap="2">
        <Code whiteSpace="pre" overflowX="auto" width="100%">
          {JSON.stringify(json, null, 2)}
        </Code>
      </Flex>
    </Box>
  );
}
