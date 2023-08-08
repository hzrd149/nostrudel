import { SettingsIcon } from "@chakra-ui/icons";
import { Avatar, Button, Flex, FlexProps, Heading, IconButton, LinkOverlay, Text, VStack } from "@chakra-ui/react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useCurrentAccount } from "../../hooks/use-current-account";
import accountService from "../../services/account";
import { ConnectedRelays } from "../connected-relays";
import {
  ChatIcon,
  EditIcon,
  FeedIcon,
  LiveStreamIcon,
  LogoutIcon,
  MapIcon,
  NotificationIcon,
  ProfileIcon,
  RelayIcon,
  SearchIcon,
} from "../icons";
import ProfileLink from "./profile-link";
import AccountSwitcher from "./account-switcher";
import { useContext } from "react";
import { PostModalContext } from "../../providers/post-modal-provider";

export default function DesktopSideNav(props: Omit<FlexProps, "children">) {
  const navigate = useNavigate();
  const account = useCurrentAccount();
  const { openModal } = useContext(PostModalContext);

  return (
    <Flex {...props} gap="2" direction="column" width="15rem" pt="2" alignItems="stretch" flexShrink={0}>
      <Flex gap="2" alignItems="center" position="relative">
        <LinkOverlay as={RouterLink} to="/" />
        <Avatar src="/apple-touch-icon.png" size="sm" />
        <Heading size="md">noStrudel</Heading>
      </Flex>
      <ProfileLink />
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
      <Button onClick={() => navigate("/streams")} leftIcon={<LiveStreamIcon />}>
        Streams
      </Button>
      <Button onClick={() => navigate("/map")} leftIcon={<MapIcon />}>
        Map
      </Button>
      <Button onClick={() => navigate("/relays")} leftIcon={<RelayIcon />}>
        Relays
      </Button>
      <Button onClick={() => navigate("/profile")} leftIcon={<ProfileIcon />}>
        Profile
      </Button>
      <Button onClick={() => navigate("/settings")} leftIcon={<SettingsIcon />}>
        Settings
      </Button>
      {account && (
        <Button onClick={() => accountService.logout()} leftIcon={<LogoutIcon />}>
          Logout
        </Button>
      )}
      {account?.readonly && (
        <Text color="red.200" textAlign="center">
          Readonly Mode
        </Text>
      )}
      <ConnectedRelays />
      <Flex justifyContent="flex-end" py="8">
        <IconButton
          icon={<EditIcon />}
          aria-label="New post"
          w="4rem"
          h="4rem"
          fontSize="1.5rem"
          borderRadius="50%"
          colorScheme="brand"
          onClick={() => openModal()}
        />
      </Flex>
    </Flex>
  );
}
