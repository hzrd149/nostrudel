import { AbsoluteCenter, Box, Button, Divider } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import {
  ChatIcon,
  FeedIcon,
  LiveStreamIcon,
  MapIcon,
  NotificationIcon,
  ProfileIcon,
  RelayIcon,
  SearchIcon,
  SettingsIcon,
  ToolsIcon,
} from "../icons";

export default function NavItems({ isInDrawer = false }: { isInDrawer?: boolean }) {
  const navigate = useNavigate();

  return (
    <>
      <Button onClick={() => navigate("/")} leftIcon={<FeedIcon />} justifyContent="flex-start">
        Notes
      </Button>
      <Button onClick={() => navigate("/notifications")} leftIcon={<NotificationIcon />} justifyContent="flex-start">
        Notifications
      </Button>
      <Button onClick={() => navigate("/dm")} leftIcon={<ChatIcon />} justifyContent="flex-start">
        Messages
      </Button>
      <Button onClick={() => navigate("/search")} leftIcon={<SearchIcon />} justifyContent="flex-start">
        Search
      </Button>
      <Button onClick={() => navigate("/relays")} leftIcon={<RelayIcon />} justifyContent="flex-start">
        Relays
      </Button>
      <Box position="relative" py="4">
        <Divider />
        <AbsoluteCenter
          backgroundColor={isInDrawer ? "var(--drawer-bg)" : "var(--chakra-colors-chakra-body-bg)"}
          px="2"
        >
          Other Stuff
        </AbsoluteCenter>
      </Box>
      <Button onClick={() => navigate("/streams")} leftIcon={<LiveStreamIcon />} justifyContent="flex-start">
        Streams
      </Button>
      <Button onClick={() => navigate("/map")} leftIcon={<MapIcon />} justifyContent="flex-start">
        Map
      </Button>
      <Button onClick={() => navigate("/tools")} leftIcon={<ToolsIcon />} justifyContent="flex-start">
        Tools
      </Button>
      <Divider my="2" />
      <Button onClick={() => navigate("/settings")} leftIcon={<SettingsIcon />} justifyContent="flex-start">
        Settings
      </Button>
    </>
  );
}
