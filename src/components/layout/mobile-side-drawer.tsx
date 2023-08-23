import {
  Avatar,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  DrawerProps,
  Flex,
  Text,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import { ConnectedRelays } from "../connected-relays";
import { LogoutIcon } from "../icons";
import { UserAvatar } from "../user-avatar";
import { UserLink } from "../user-link";
import AccountSwitcher from "./account-switcher";
import { useCurrentAccount } from "../../hooks/use-current-account";
import accountService from "../../services/account";
import NavItems from "./nav-items";

export default function MobileSideDrawer({ ...props }: Omit<DrawerProps, "children">) {
  const account = useCurrentAccount();

  return (
    <Drawer placement="left" {...props}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader px="2" py="4">
          {account ? (
            <Flex gap="2">
              <UserAvatar pubkey={account.pubkey} size="sm" noProxy />
              <UserLink pubkey={account.pubkey} />
            </Flex>
          ) : (
            <Flex gap="2">
              <Avatar src="/apple-touch-icon.png" size="sm" />
              <Text m={0}>Nostrudel</Text>
            </Flex>
          )}
        </DrawerHeader>
        <DrawerBody padding={0} overflowY="auto" overflowX="hidden">
          <AccountSwitcher />
          <Flex direction="column" gap="2" padding="2">
            <NavItems isInDrawer />
            {account ? (
              <Button onClick={() => accountService.logout()} leftIcon={<LogoutIcon />} justifyContent="flex-start">
                Logout
              </Button>
            ) : (
              <Button as={RouterLink} to="/login" colorScheme="brand">
                Login
              </Button>
            )}
            <ConnectedRelays />
          </Flex>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
