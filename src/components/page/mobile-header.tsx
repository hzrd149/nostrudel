import { Flex, IconButton, Text, useDisclosure } from "@chakra-ui/react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCurrentAccount } from "../../hooks/use-current-account";
import { ConnectedRelays } from "../connected-relays";
import { NotificationIcon } from "../icons";
import { UserAvatar } from "../user-avatar";
import MobileSideDrawer from "./mobile-side-drawer";

export default function MobileHeader() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const account = useCurrentAccount();

  const location = useLocation();
  useEffect(() => onClose(), [location.key, account]);

  return (
    <>
      <Flex justifyContent="space-between" padding="2" alignItems="center">
        <UserAvatar pubkey={account.pubkey} size="sm" onClick={onOpen} />
        {account.readonly && (
          <Text color="red.200" textAlign="center">
            Readonly Mode
          </Text>
        )}
        <Flex gap="2">
          <ConnectedRelays />
          <IconButton
            as={Link}
            variant="ghost"
            icon={<NotificationIcon />}
            aria-label="Notifications"
            title="Notifications"
            size="sm"
            to="/notifications"
          />
        </Flex>
      </Flex>
      <MobileSideDrawer isOpen={isOpen} onClose={onClose} />
    </>
  );
}
