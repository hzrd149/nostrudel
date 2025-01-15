import { Avatar, Flex, FlexProps, IconButton, useDisclosure } from "@chakra-ui/react";
import { useEffect } from "react";
import { useLocation, Link as RouterLink } from "react-router-dom";

import useCurrentAccount from "../../hooks/use-current-account";
import { DirectMessagesIcon, NotesIcon, NotificationsIcon, PlusCircleIcon, SearchIcon } from "../icons";
import UserAvatar from "../user/user-avatar";
import MobileSideDrawer from "../layout/mobile/nav-drawer";
import Rocket02 from "../icons/rocket-02";

export default function MobileBottomNav(props: Omit<FlexProps, "children">) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const account = useCurrentAccount();

  const location = useLocation();
  useEffect(() => onClose(), [location.key, account]);

  return (
    <>
      <Flex {...props} gap="2" p="2" alignItems="center" pb="calc(var(--chakra-space-2) + env(safe-area-inset-bottom))">
        {account ? (
          <UserAvatar pubkey={account.pubkey} size="sm" onClick={onOpen} noProxy />
        ) : (
          <Avatar size="sm" src="/apple-touch-icon.png" onClick={onOpen} cursor="pointer" />
        )}
        <IconButton as={RouterLink} icon={<NotesIcon boxSize={6} />} aria-label="Home" flexGrow="1" size="md" to="/" />
        <IconButton
          as={RouterLink}
          icon={<SearchIcon boxSize={6} />}
          aria-label="Search"
          flexGrow="1"
          size="md"
          to="/search"
        />
        <IconButton
          as={RouterLink}
          icon={<PlusCircleIcon boxSize={6} />}
          aria-label="Create new"
          title="Create new"
          variant="solid"
          colorScheme="primary"
          to="/new"
        />
        <IconButton
          as={RouterLink}
          icon={<DirectMessagesIcon boxSize={6} />}
          aria-label="Messages"
          flexGrow="1"
          size="md"
          to="/dm"
        />
        <IconButton
          as={RouterLink}
          icon={<NotificationsIcon boxSize={6} />}
          aria-label="Notifications"
          flexGrow="1"
          size="md"
          to="/notifications"
        />
        <IconButton as={RouterLink} icon={<Rocket02 boxSize={6} />} aria-label="Launchpad" to="/launchpad" />
      </Flex>
      <MobileSideDrawer isOpen={isOpen} onClose={onClose} />
    </>
  );
}
