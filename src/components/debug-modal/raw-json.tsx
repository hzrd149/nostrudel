import { Box, Code, Heading } from "@chakra-ui/react";

export default function RawJson({ json, heading }: { heading: string; json: any }) {
  return (
    <Box w="full">
      <Heading size="sm" mb="2">
        {heading}
      </Heading>
      <Code whiteSpace="pre" overflowX="auto" width="100%" p="2" rounded="md" w="full">
        {JSON.stringify(json, null, 2)}
      </Code>
    </Box>
  );
}
