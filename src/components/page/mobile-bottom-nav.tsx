import { Flex, IconButton } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { FeedIcon, ProfileIcon, SettingsIcon } from "../icons";

export default function MobileBottomNav() {
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
}
