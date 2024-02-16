import { Avatar, Flex, FlexProps, IconButton, useDisclosure } from "@chakra-ui/react";
import { useContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import useCurrentAccount from "../../hooks/use-current-account";
import { PostModalContext } from "../../providers/route/post-modal-provider";
import { DirectMessagesIcon, NotesIcon, NotificationsIcon, PlusCircleIcon, SearchIcon } from "../icons";
import UserAvatar from "../user/user-avatar";
import MobileSideDrawer from "./mobile-side-drawer";
import Rocket02 from "../icons/rocket-02";

export default function MobileBottomNav(props: Omit<FlexProps, "children">) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { openModal } = useContext(PostModalContext);
  const navigate = useNavigate();
  const account = useCurrentAccount();

  const location = useLocation();
  useEffect(() => onClose(), [location.key, account]);

  return (
    <>
      <Flex {...props} gap="2" padding="2" alignItems="center">
        {account ? (
          <UserAvatar pubkey={account.pubkey} size="sm" onClick={onOpen} noProxy />
        ) : (
          <Avatar size="sm" src="/apple-touch-icon.png" onClick={onOpen} cursor="pointer" />
        )}
        <IconButton
          icon={<NotesIcon boxSize={6} />}
          aria-label="Home"
          onClick={() => navigate("/")}
          flexGrow="1"
          size="md"
        />
        <IconButton
          icon={<SearchIcon boxSize={6} />}
          aria-label="Search"
          onClick={() => navigate(`/search`)}
          flexGrow="1"
          size="md"
        />
        <IconButton
          icon={<PlusCircleIcon boxSize={6} />}
          aria-label="New Note"
          onClick={() => {
            openModal();
          }}
          variant="solid"
          colorScheme="primary"
          isDisabled={account?.readonly ?? true}
        />
        <IconButton
          icon={<DirectMessagesIcon boxSize={6} />}
          aria-label="Messages"
          onClick={() => navigate(`/dm`)}
          flexGrow="1"
          size="md"
        />
        <IconButton
          icon={<NotificationsIcon boxSize={6} />}
          aria-label="Notifications"
          onClick={() => navigate("/notifications")}
          flexGrow="1"
          size="md"
        />
        <IconButton
          icon={<Rocket02 boxSize={6} />}
          aria-label="Launchpad"
          onClick={() => navigate("/launchpad")}
          isDisabled={account?.readonly ?? true}
        />
      </Flex>
      <MobileSideDrawer isOpen={isOpen} onClose={onClose} />
    </>
  );
}
