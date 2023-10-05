import { Box, Button, ButtonProps, Text } from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { nip19 } from "nostr-tools";

import {
  BadgeIcon,
  MessagesIcon,
  CommunityIcon,
  EmojiIcon,
  FeedIcon,
  GoalIcon,
  ListIcon,
  LiveStreamIcon,
  NotificationIcon,
  ProfileIcon,
  RelayIcon,
  SearchIcon,
  SettingsIcon,
  ToolsIcon,
  LogoutIcon,
} from "../icons";
import { useCurrentAccount } from "../../hooks/use-current-account";
import accountService from "../../services/account";

export default function NavItems() {
  const navigate = useNavigate();
  const location = useLocation();
  const account = useCurrentAccount();

  const buttonProps: ButtonProps = {
    py: "2",
    justifyContent: "flex-start",
    variant: "link",
  };

  let active = "notes";
  if (location.pathname.startsWith("/notifications")) active = "notifications";
  else if (location.pathname.startsWith("/dm")) active = "dm";
  else if (location.pathname.startsWith("/streams")) active = "streams";
  else if (location.pathname.startsWith("/relays")) active = "relays";
  else if (location.pathname.startsWith("/lists")) active = "lists";
  else if (location.pathname.startsWith("/communities")) active = "communities";
  else if (location.pathname.startsWith("/goals")) active = "goals";
  else if (location.pathname.startsWith("/badges")) active = "badges";
  else if (location.pathname.startsWith("/emojis")) active = "emojis";
  else if (location.pathname.startsWith("/settings")) active = "settings";
  else if (location.pathname.startsWith("/tools")) active = "tools";
  else if (location.pathname.startsWith("/search")) active = "search";
  else if (location.pathname.startsWith("/t/")) active = "search";
  else if (
    account &&
    (location.pathname.startsWith("/u/" + nip19.npubEncode(account.pubkey)) ||
      location.pathname.startsWith("/u/" + account.pubkey))
  ) {
    active = "profile";
  }

  return (
    <>
      <Button
        onClick={() => navigate("/")}
        leftIcon={<FeedIcon />}
        colorScheme={active === "notes" ? "primary" : undefined}
        {...buttonProps}
      >
        Notes
      </Button>
      {account && (
        <>
          <Button
            onClick={() => navigate("/notifications")}
            leftIcon={<NotificationIcon />}
            colorScheme={active === "notifications" ? "primary" : undefined}
            {...buttonProps}
          >
            Notifications
          </Button>
          <Button
            onClick={() => navigate("/dm")}
            leftIcon={<MessagesIcon />}
            colorScheme={active === "dm" ? "primary" : undefined}
            {...buttonProps}
          >
            Messages
          </Button>
        </>
      )}
      <Button
        onClick={() => navigate("/search")}
        leftIcon={<SearchIcon />}
        colorScheme={active === "search" ? "primary" : undefined}
        {...buttonProps}
      >
        Search
      </Button>
      {account?.pubkey && (
        <Button
          onClick={() => navigate("/u/" + nip19.npubEncode(account.pubkey))}
          leftIcon={<ProfileIcon />}
          colorScheme={active === "profile" ? "primary" : undefined}
          {...buttonProps}
        >
          Profile
        </Button>
      )}
      <Button
        onClick={() => navigate("/relays")}
        leftIcon={<RelayIcon />}
        colorScheme={active === "relays" ? "primary" : undefined}
        {...buttonProps}
      >
        Relays
      </Button>
      <Text position="relative" py="2" color="GrayText">
        Other Stuff
      </Text>
      <Button
        onClick={() => navigate("/streams")}
        leftIcon={<LiveStreamIcon />}
        colorScheme={active === "streams" ? "primary" : undefined}
        {...buttonProps}
      >
        Streams
      </Button>
      <Button
        onClick={() => navigate("/communities")}
        leftIcon={<CommunityIcon />}
        colorScheme={active === "communities" ? "primary" : undefined}
        {...buttonProps}
      >
        Communities
      </Button>
      <Button
        onClick={() => navigate("/lists")}
        leftIcon={<ListIcon />}
        colorScheme={active === "lists" ? "primary" : undefined}
        {...buttonProps}
      >
        Lists
      </Button>
      <Button
        onClick={() => navigate("/goals")}
        leftIcon={<GoalIcon />}
        colorScheme={active === "goals" ? "primary" : undefined}
        {...buttonProps}
      >
        Goals
      </Button>
      <Button
        onClick={() => navigate("/badges")}
        leftIcon={<BadgeIcon />}
        colorScheme={active === "badges" ? "primary" : undefined}
        {...buttonProps}
      >
        Badges
      </Button>
      <Button
        onClick={() => navigate("/emojis")}
        leftIcon={<EmojiIcon />}
        colorScheme={active === "emojis" ? "primary" : undefined}
        {...buttonProps}
      >
        Emojis
      </Button>
      <Button
        onClick={() => navigate("/tools")}
        leftIcon={<ToolsIcon />}
        colorScheme={active === "tools" ? "primary" : undefined}
        {...buttonProps}
      >
        Tools
      </Button>
      <Box h="4" />
      <Button
        onClick={() => navigate("/settings")}
        leftIcon={<SettingsIcon />}
        colorScheme={active === "settings" ? "primary" : undefined}
        {...buttonProps}
      >
        Settings
      </Button>
      {account && (
        <Button onClick={() => accountService.logout()} leftIcon={<LogoutIcon />} {...buttonProps}>
          Logout
        </Button>
      )}
    </>
  );
}
