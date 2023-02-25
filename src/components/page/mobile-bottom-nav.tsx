import { ChatIcon } from "@chakra-ui/icons";
import { Flex, IconButton } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { FeedIcon, SettingsIcon } from "../icons";

export default function MobileBottomNav() {
  const navigate = useNavigate();

  return (
    <Flex flexShrink={0} gap="2" padding="2">
      <IconButton icon={<FeedIcon />} aria-label="Home" onClick={() => navigate("/")} flexGrow="1" size="lg" />
      <IconButton icon={<ChatIcon />} aria-label="Messages" onClick={() => navigate(`/dm`)} flexGrow="1" size="lg" />
      <IconButton
        icon={<SettingsIcon />}
        aria-label="Settings"
        onClick={() => navigate("/settings")}
        flexGrow="1"
        size="lg"
      />
    </Flex>
  );
}
