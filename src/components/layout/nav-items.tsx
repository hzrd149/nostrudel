import { AbsoluteCenter, Box, Button, ButtonProps, Divider, Text } from "@chakra-ui/react";
import { useLoaderData, useLocation, useNavigate } from "react-router-dom";
import {
  BadgeIcon,
  ChatIcon,
  CommunityIcon,
  EmojiIcon,
  FeedIcon,
  GoalIcon,
  ListIcon,
  LiveStreamIcon,
  NotificationIcon,
  RelayIcon,
  SearchIcon,
  SettingsIcon,
  ToolsIcon,
} from "../icons";
import { useCurrentAccount } from "../../hooks/use-current-account";

export default function NavItems() {
  const navigate = useNavigate();
  const location = useLocation();
  const account = useCurrentAccount();

  const buttonProps: ButtonProps = {
    py: "2",
    pl: "2",
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

  return (
    <>
      <Button
        onClick={() => navigate("/")}
        leftIcon={<FeedIcon />}
        colorScheme={active === "notes" ? "brand" : undefined}
        {...buttonProps}
      >
        Notes
      </Button>
      {account && (
        <>
          <Button
            onClick={() => navigate("/notifications")}
            leftIcon={<NotificationIcon />}
            colorScheme={active === "notifications" ? "brand" : undefined}
            {...buttonProps}
          >
            Notifications
          </Button>
          <Button
            onClick={() => navigate("/dm")}
            leftIcon={<ChatIcon />}
            colorScheme={active === "dm" ? "brand" : undefined}
            {...buttonProps}
          >
            Messages
          </Button>
        </>
      )}
      <Button
        onClick={() => navigate("/search")}
        leftIcon={<SearchIcon />}
        colorScheme={active === "search" ? "brand" : undefined}
        {...buttonProps}
      >
        Search
      </Button>
      <Button
        onClick={() => navigate("/relays")}
        leftIcon={<RelayIcon />}
        colorScheme={active === "relays" ? "brand" : undefined}
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
        colorScheme={active === "streams" ? "brand" : undefined}
        {...buttonProps}
      >
        Streams
      </Button>
      <Button
        onClick={() => navigate("/lists")}
        leftIcon={<ListIcon />}
        colorScheme={active === "lists" ? "brand" : undefined}
        {...buttonProps}
      >
        Lists
      </Button>
      <Button
        onClick={() => navigate("/communities")}
        leftIcon={<CommunityIcon />}
        colorScheme={active === "communities" ? "brand" : undefined}
        {...buttonProps}
      >
        Communities
      </Button>
      <Button
        onClick={() => navigate("/goals")}
        leftIcon={<GoalIcon />}
        colorScheme={active === "goals" ? "brand" : undefined}
        {...buttonProps}
      >
        Goals
      </Button>
      <Button
        onClick={() => navigate("/badges")}
        leftIcon={<BadgeIcon />}
        colorScheme={active === "badges" ? "brand" : undefined}
        {...buttonProps}
      >
        Badges
      </Button>
      <Button
        onClick={() => navigate("/emojis")}
        leftIcon={<EmojiIcon />}
        colorScheme={active === "emojis" ? "brand" : undefined}
        {...buttonProps}
      >
        Emojis
      </Button>
      <Button
        onClick={() => navigate("/tools")}
        leftIcon={<ToolsIcon />}
        colorScheme={active === "tools" ? "brand" : undefined}
        {...buttonProps}
      >
        Tools
      </Button>
      <Divider my="2" />
      <Button
        onClick={() => navigate("/settings")}
        leftIcon={<SettingsIcon />}
        colorScheme={active === "settings" ? "brand" : undefined}
        {...buttonProps}
      >
        Settings
      </Button>
    </>
  );
}
