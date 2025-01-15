import {
  Avatar,
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  DrawerProps,
  Flex,
  Text,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import AccountSwitcher from "../../legacy-layout/account-switcher";
import useCurrentAccount from "../../../hooks/use-current-account";
import NavItems from "../nav-items";
import TaskManagerButtons from "../../legacy-layout/task-manager-buttons";
import { ExpandedContext } from "../desktop/side-nav";
import NavItem from "../nav-items/nav-item";
import { SettingsIcon } from "../../icons";

export default function NavDrawer({ ...props }: Omit<DrawerProps, "children">) {
  const account = useCurrentAccount();

  return (
    <Drawer placement="left" {...props}>
      <DrawerOverlay />
      <DrawerContent>
        <ExpandedContext.Provider value={true}>
          <DrawerBody display="flex" flexDirection="column" px="4" pt="4" overflowY="auto" overflowX="hidden" gap="2">
            {account ? (
              <AccountSwitcher />
            ) : (
              <Flex gap="2" my="2" alignItems="center">
                <Avatar src="/apple-touch-icon.png" size="md" />
                <Text m={0}>Nostrudel</Text>
              </Flex>
            )}
            <NavItems />
            <Box h="2" />
            {!account && (
              <Button as={RouterLink} to="/signin" colorScheme="primary" flexShrink={0}>
                Sign in
              </Button>
            )}
            <NavItem label="Settings" icon={SettingsIcon} to="/settings" />
            <TaskManagerButtons mt="auto" flexShrink={0} />
          </DrawerBody>
        </ExpandedContext.Provider>
      </DrawerContent>
    </Drawer>
  );
}
