import { Flex, IconButton } from "@chakra-ui/react";
import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { PostModalContext } from "../../providers/post-modal-provider";
import { ChatIcon, HomeIcon, NotificationIcon, PlusCircleIcon, SearchIcon } from "../icons";

export default function MobileBottomNav() {
  const { openModal } = useContext(PostModalContext);
  const navigate = useNavigate();
  const account = useCurrentAccount();

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
      <IconButton
        icon={<PlusCircleIcon fontSize="1.8em" />}
        aria-label="New Note"
        onClick={() => {
          openModal();
        }}
        variant="solid"
        colorScheme="brand"
        isDisabled={account.readonly}
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
