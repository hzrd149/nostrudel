import { Avatar, Flex, IconButton, useDisclosure } from "@chakra-ui/react";
import { useContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { PostModalContext } from "../../providers/post-modal-provider";
import { ChatIcon, FeedIcon, HomeIcon, NotificationIcon, PlusCircleIcon, SearchIcon } from "../icons";
import { UserAvatar } from "../user-avatar";
import MobileSideDrawer from "./mobile-side-drawer";

export default function MobileBottomNav() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { openModal } = useContext(PostModalContext);
  const navigate = useNavigate();
  const account = useCurrentAccount();

  const location = useLocation();
  useEffect(() => onClose(), [location.key, account]);

  return (
    <>
      <Flex flexShrink={0} gap="2" padding="2" alignItems="center">
        {account ? (
          <UserAvatar pubkey={account.pubkey} size="sm" onClick={onOpen} noProxy />
        ) : (
          <Avatar size="sm" src="/apple-touch-icon.png" onClick={onOpen} cursor="pointer" />
        )}
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
          isDisabled={account?.readonly ?? true}
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
      <MobileSideDrawer isOpen={isOpen} onClose={onClose} />
    </>
  );
}
