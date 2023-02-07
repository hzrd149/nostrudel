import React from "react";
import { Box, Button, Container, HStack, VStack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { ErrorBoundary } from "./error-boundary";

export const Page = ({ children }) => {
  const navigate = useNavigate();

  return (
    <Container size="lg" padding={4}>
      <HStack alignItems="flex-start" spacing={4} overflow="hidden">
        <VStack style={{ width: "20rem" }} alignItems="stretch" flexShrink={0}>
          <Button onClick={() => navigate("/")}>Home</Button>
          <Button onClick={() => navigate("/global")}>Global</Button>
          <Button onClick={() => navigate("/settings")}>Settings</Button>
        </VStack>
        <Box flexGrow={1} overflow="auto">
          <ErrorBoundary>{children}</ErrorBoundary>
        </Box>
      </HStack>
    </Container>
  );
};
