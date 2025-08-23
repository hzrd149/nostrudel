import { Box, Heading, Text, VStack, Link } from "@chakra-ui/react";

import ScrollLayout from "../../../components/layout/presets/scroll-layout";

export default function BlossomDiscoveryView() {
  return (
    <ScrollLayout maxW="4xl" center>
      <VStack spacing="6" align="stretch">
        <Box textAlign="center">
          <Heading size="lg" mb="4">
            Blossom Servers
          </Heading>
          <Text color="gray.600" mb="4">
            This discovery page is still being built.
          </Text>
          <Text color="gray.600">
            In the meantime, you can find Blossom servers at{" "}
            <Link
              href="https://blossomservers.com"
              target="_blank"
              rel="noopener noreferrer"
              color="blue.500"
              textDecoration="underline"
            >
              blossomservers.com
            </Link>
          </Text>
        </Box>

        <Box>
          <Text fontSize="sm" color="gray.500">
            You can also enter a Blossom server URL directly in the address bar to view its details.
            <br />
            Example: /blossom/https://example.com
          </Text>
        </Box>
      </VStack>
    </ScrollLayout>
  );
}
