import React from "react";
import { Avatar, Button, Container, Flex, Heading, IconButton, LinkOverlay, Text, VStack } from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { FeedIcon, LogoutIcon, NotificationIcon, ProfileIcon, RelayIcon, SettingsIcon } from "./icons";
import { ErrorBoundary } from "./error-boundary";
import { ConnectedRelays } from "./connected-relays";

import { useIsMobile } from "../hooks/use-is-mobile";
import accountService from "../services/account";
import { FollowingList } from "./following-list";
import { ReloadPrompt } from "./reload-prompt";
import { PostModalProvider } from "../providers/post-modal-provider";
import { useReadonlyMode } from "../hooks/use-readonly-mode";
import { ProfileButton } from "./profile-button";
import { UserAvatarLink } from "./user-avatar-link";
import { useCurrentAccount } from "../hooks/use-current-account";

const MobileProfileHeader = () => {
  const account = useCurrentAccount();

  return (
    <Flex justifyContent="space-between" padding="2" alignItems="center">
      <UserAvatarLink pubkey={account.pubkey} size="sm" />
      {account.readonly && (
        <Button
          colorScheme="red"
          textAlign="center"
          variant="link"
          onClick={() => confirm("Exit readonly mode?") && accountService.logout()}
        >
          Readonly Mode
        </Button>
      )}
      <Flex gap="2">
        <ConnectedRelays />
        <IconButton
          as={Link}
          variant="ghost"
          icon={<NotificationIcon />}
          aria-label="Notifications"
          title="Notifications"
          size="sm"
          to="/notifications"
        />
      </Flex>
    </Flex>
  );
};

const MobileBottomNav = () => {
  const navigate = useNavigate();

  return (
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
  );
};

const DesktopSideNav = () => {
  const navigate = useNavigate();
  const readonly = useReadonlyMode();

  return (
    <VStack width="15rem" pt="2" alignItems="stretch" flexShrink={0}>
      <Flex gap="2" alignItems="center" position="relative">
        <LinkOverlay as={Link} to="/" />
        <Avatar src="/apple-touch-icon.png" size="sm" />
        <Heading size="md">noStrudel</Heading>
      </Flex>
      <ProfileButton />
      <Button onClick={() => navigate("/")} leftIcon={<FeedIcon />}>
        Home
      </Button>
      <Button onClick={() => navigate("/notifications")} leftIcon={<NotificationIcon />}>
        Notifications
      </Button>
      <Button onClick={() => navigate("/relays")} leftIcon={<RelayIcon />}>
        Relays
      </Button>
      <Button onClick={() => navigate("/settings")} leftIcon={<SettingsIcon />}>
        Settings
      </Button>
      <Button onClick={() => accountService.logout()} leftIcon={<LogoutIcon />}>
        Logout
      </Button>
      {readonly && (
        <Text color="red.200" textAlign="center">
          Readonly Mode
        </Text>
      )}
      <ConnectedRelays />
    </VStack>
  );
};

const FollowingSideNav = () => {
  return (
    <VStack width="15rem" pt="2" alignItems="stretch" flexShrink={0}>
      <Heading size="md">Following</Heading>
      <FollowingList />
    </VStack>
  );
};

export const Page = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();

  return (
    <Container
      size="lg"
      display="flex"
      flexDirection="column"
      height="100vh"
      overflow="hidden"
      position="relative"
      padding="0"
    >
      <ReloadPrompt />
      {isMobile && <MobileProfileHeader />}
      <Flex gap="4" grow={1} overflow="hidden">
        {!isMobile && <DesktopSideNav />}
        <Flex flexGrow={1} direction="column" overflow="hidden">
          <ErrorBoundary>
            <PostModalProvider>{children}</PostModalProvider>
          </ErrorBoundary>
        </Flex>
        {!isMobile && <FollowingSideNav />}
      </Flex>
      {isMobile && <MobileBottomNav />}
    </Container>
  );
};
