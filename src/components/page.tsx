import React from "react";
import { Button, Container, Flex, Heading, IconButton, VStack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { HomeIcon, LogoutIcon, ProfileIcon, SettingsIcon } from "./icons";
import { ErrorBoundary } from "./error-boundary";
import { ConnectedRelays } from "./connected-relays";

import { useIsMobile } from "../hooks/use-is-mobile";
import { ProfileButton } from "./profile-button";
import identity from "../services/identity";
import { FollowingList } from "./following-list";
import { ReloadPrompt } from "./reload-prompt";

const MobileLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  return (
    <Flex direction="column" height="100%">
      <ReloadPrompt />
      <Flex flexGrow={1} direction="column" overflow="hidden">
        {children}
      </Flex>
      <Flex flexShrink={0} gap="2" padding="2">
        <IconButton icon={<HomeIcon />} aria-label="Home" onClick={() => navigate("/")} flexGrow="1" size="lg" />
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
};
const DesktopLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  return (
    <>
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
            <ProfileButton to="/profile" />
            <Button onClick={() => navigate("/")} leftIcon={<HomeIcon />}>
              Home
            </Button>
            <Button onClick={() => navigate("/settings")} leftIcon={<SettingsIcon />}>
              Settings
            </Button>
            <Button onClick={() => identity.logout()} leftIcon={<LogoutIcon />}>
              Logout
            </Button>
            <ConnectedRelays />
          </VStack>
          <Flex flexGrow={1} direction="column" overflow="hidden">
            <ErrorBoundary>{children}</ErrorBoundary>
          </Flex>
          <VStack width="15rem" pt="2" alignItems="stretch" flexShrink={0}>
            <Heading size="md">Following</Heading>
            <FollowingList />
          </VStack>
        </Flex>
      </Container>
    </>
  );
};

export const Page = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();
  const Layout = isMobile ? MobileLayout : DesktopLayout;

  return <Layout>{children}</Layout>;
};
