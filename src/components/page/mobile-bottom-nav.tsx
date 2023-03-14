import { ChatIcon } from "@chakra-ui/icons";
import { Flex, IconButton } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { FeedIcon, HomeIcon, NotificationIcon, SearchIcon, SettingsIcon } from "../icons";

export default function MobileBottomNav() {
  const navigate = useNavigate();

  return (
    <Flex flexShrink={0} gap="2" padding="2">
      <IconButton icon={<HomeIcon />} aria-label="Home" onClick={() => navigate("/")} flexGrow="1" size="md" />
      <IconButton
        icon={<SearchIcon />}
        aria-label="Search"
        onClick={() => navigate(`/search`)}
        flexGrow="1"
        size="md"
      />
      <IconButton icon={<ChatIcon />} aria-label="Messages" onClick={() => navigate(`/dm`)} flexGrow="1" size="md" />
      <IconButton
        icon={<NotificationIcon />}
        aria-label="Notifications"
        onClick={() => navigate("/notifications")}
        flexGrow="1"
        size="md"
      />
    </Flex>
  );
}
