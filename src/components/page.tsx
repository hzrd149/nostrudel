import React from "react";
import { Avatar, Button, Container, Flex, Heading, IconButton, LinkOverlay, Text, VStack } from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { FeedIcon, LogoutIcon, ProfileIcon, SettingsIcon } from "./icons";
import { ErrorBoundary } from "./error-boundary";
import { ConnectedRelays } from "./connected-relays";

import { useIsMobile } from "../hooks/use-is-mobile";
import identity from "../services/identity";
import { FollowingList } from "./following-list";
import { ReloadPrompt } from "./reload-prompt";
import { PostModalProvider } from "../providers/post-modal-provider";
import { useReadonlyMode } from "../hooks/use-readonly-mode";

export const Page = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const readonly = useReadonlyMode();

  if (isMobile) {
    return (
      <Flex direction="column" height="100%">
        <ReloadPrompt />
        <Flex flexGrow={1} direction="column" overflow="hidden">
          <ErrorBoundary>
            <PostModalProvider>{children}</PostModalProvider>
          </ErrorBoundary>
        </Flex>
        <Flex flexShrink={0} gap="2" padding="2">
          <IconButton icon={<FeedIcon />} aria-label="Home" onClick={() => navigate("/")} flexGrow="1" size="lg" />
          <IconButton
            icon={<ProfileIcon />}
            aria-label="Profile"
            onClick={() => navigate(`/profile`)}
            flexGrow="1"
            size="lg"
          />
          <IconButton
            icon={<SettingsIcon />}
            aria-label="Settings"
            onClick={() => navigate("/settings")}
            flexGrow="1"
            size="lg"
          />
        </Flex>
      </Flex>
    );
  }

  return (
    <Container
      size="lg"
      display="flex"
      gap="2"
      flexDirection="column"
      height="100vh"
      overflow="hidden"
      position="relative"
    >
      <ReloadPrompt />
      <Flex gap="4" grow={1} overflow="hidden">
        <VStack width="15rem" pt="2" alignItems="stretch" flexShrink={0}>
          <Flex gap="2" alignItems="center" position="relative">
            <LinkOverlay as={Link} to="/" />
            <Avatar src="/apple-touch-icon.png" size="sm" />
            <Heading size="md">noStrudel</Heading>
          </Flex>
          <Button onClick={() => navigate("/")} leftIcon={<FeedIcon />}>
            Home
          </Button>
          <Button onClick={() => navigate("/settings")} leftIcon={<SettingsIcon />}>
            Settings
          </Button>
          <Button onClick={() => identity.logout()} leftIcon={<LogoutIcon />}>
            Logout
          </Button>
          {readonly && (
            <Text color="yellow.500" textAlign="center">
              Readonly Mode
            </Text>
          )}
          <ConnectedRelays />
        </VStack>
        <Flex flexGrow={1} direction="column" overflow="hidden">
          <ErrorBoundary>
            <PostModalProvider>{children}</PostModalProvider>
          </ErrorBoundary>
        </Flex>
        <VStack width="15rem" pt="2" alignItems="stretch" flexShrink={0}>
          <Heading size="md">Following</Heading>
          <FollowingList />
        </VStack>
      </Flex>
    </Container>
  );
};
