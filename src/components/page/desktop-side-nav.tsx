import { SettingsIcon } from "@chakra-ui/icons";
import { Avatar, Button, Flex, Heading, LinkOverlay, Text, VStack } from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { useCurrentAccount } from "../../hooks/use-current-account";
import accountService from "../../services/account";
import { ConnectedRelays } from "../connected-relays";
import { ChatIcon, FeedIcon, LogoutIcon, NotificationIcon, ProfileIcon, RelayIcon, SearchIcon } from "../icons";
import { ProfileButton } from "../profile-button";
import AccountSwitcher from "./account-switcher";

export default function DesktopSideNav() {
  const navigate = useNavigate();
  const account = useCurrentAccount();

  return (
    <VStack width="15rem" pt="2" alignItems="stretch" flexShrink={0}>
      <Flex gap="2" alignItems="center" position="relative">
        <LinkOverlay as={Link} to="/" />
        <Avatar src="/apple-touch-icon.png" size="sm" />
        <Heading size="md">noStrudel</Heading>
      </Flex>
      <ProfileButton />
      <AccountSwitcher />
      <Button onClick={() => navigate("/")} leftIcon={<FeedIcon />}>
        Home
      </Button>
      <Button onClick={() => navigate("/notifications")} leftIcon={<NotificationIcon />}>
        Notifications
      </Button>
      <Button onClick={() => navigate("/dm")} leftIcon={<ChatIcon />}>
        Messages
      </Button>
      <Button onClick={() => navigate("/search")} leftIcon={<SearchIcon />}>
        Search
      </Button>
      <Button onClick={() => navigate("/profile")} leftIcon={<ProfileIcon />}>
        Profile
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
      {account.readonly && (
        <Text color="red.200" textAlign="center">
          Readonly Mode
        </Text>
      )}
      <ConnectedRelays />
    </VStack>
  );
}
