import { Box, Button, ButtonProps, Text } from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { nip19 } from "nostr-tools";

import {
  BadgeIcon,
  DirectMessagesIcon,
  CommunityIcon,
  EmojiPacksIcon,
  NoteFeedIcon,
  GoalIcon,
  ListsIcon,
  LiveStreamIcon,
  NotificationsIcon,
  ProfileIcon,
  RelayIcon,
  SearchIcon,
  SettingsIcon,
  ToolsIcon,
  LogoutIcon,
  NotesIcon,
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
        leftIcon={<NotesIcon boxSize={6} />}
        colorScheme={active === "notes" ? "primary" : undefined}
        {...buttonProps}
      >
        Notes
      </Button>
      {account && (
        <>
          <Button
            onClick={() => navigate("/notifications")}
            leftIcon={<NotificationsIcon boxSize={6} />}
            colorScheme={active === "notifications" ? "primary" : undefined}
            {...buttonProps}
          >
            Notifications
          </Button>
          <Button
            onClick={() => navigate("/dm")}
            leftIcon={<DirectMessagesIcon boxSize={6} />}
            colorScheme={active === "dm" ? "primary" : undefined}
            {...buttonProps}
          >
            Messages
          </Button>
        </>
      )}
      <Button
        onClick={() => navigate("/search")}
        leftIcon={<SearchIcon boxSize={6} />}
        colorScheme={active === "search" ? "primary" : undefined}
        {...buttonProps}
      >
        Search
      </Button>
      {account?.pubkey && (
        <Button
          onClick={() => navigate("/u/" + nip19.npubEncode(account.pubkey))}
          leftIcon={<ProfileIcon boxSize={6} />}
          colorScheme={active === "profile" ? "primary" : undefined}
          {...buttonProps}
        >
          Profile
        </Button>
      )}
      <Button
        onClick={() => navigate("/relays")}
        leftIcon={<RelayIcon boxSize={6} />}
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
        leftIcon={<LiveStreamIcon boxSize={6} />}
        colorScheme={active === "streams" ? "primary" : undefined}
        {...buttonProps}
      >
        Streams
      </Button>
      <Button
        onClick={() => navigate("/communities")}
        leftIcon={<CommunityIcon boxSize={6} />}
        colorScheme={active === "communities" ? "primary" : undefined}
        {...buttonProps}
      >
        Communities
      </Button>
      <Button
        onClick={() => navigate("/lists")}
        leftIcon={<ListsIcon boxSize={6} />}
        colorScheme={active === "lists" ? "primary" : undefined}
        {...buttonProps}
      >
        Lists
      </Button>
      <Button
        onClick={() => navigate("/goals")}
        leftIcon={<GoalIcon boxSize={6} />}
        colorScheme={active === "goals" ? "primary" : undefined}
        {...buttonProps}
      >
        Goals
      </Button>
      <Button
        onClick={() => navigate("/badges")}
        leftIcon={<BadgeIcon boxSize={6} />}
        colorScheme={active === "badges" ? "primary" : undefined}
        {...buttonProps}
      >
        Badges
      </Button>
      <Button
        onClick={() => navigate("/emojis")}
        leftIcon={<EmojiPacksIcon boxSize={6} />}
        colorScheme={active === "emojis" ? "primary" : undefined}
        {...buttonProps}
      >
        Emojis
      </Button>
      <Button
        onClick={() => navigate("/tools")}
        leftIcon={<ToolsIcon boxSize={6} />}
        colorScheme={active === "tools" ? "primary" : undefined}
        {...buttonProps}
      >
        Tools
      </Button>
      <Box h="4" />
      <Button
        onClick={() => navigate("/settings")}
        leftIcon={<SettingsIcon boxSize={6} />}
        colorScheme={active === "settings" ? "primary" : undefined}
        {...buttonProps}
      >
        Settings
      </Button>
      {account && (
        <Button onClick={() => accountService.logout()} leftIcon={<LogoutIcon boxSize={6} />} {...buttonProps}>
          Logout
        </Button>
      )}
    </>
  );
}
