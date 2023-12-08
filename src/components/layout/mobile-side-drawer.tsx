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

import AccountSwitcher from "./account-switcher";
import useCurrentAccount from "../../hooks/use-current-account";
import NavItems from "./nav-items";

export default function MobileSideDrawer({ ...props }: Omit<DrawerProps, "children">) {
  const account = useCurrentAccount();

  return (
    <Drawer placement="left" {...props}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerBody
          display="flex"
          flexDirection="column"
          px="4"
          pt="4"
          pb="8"
          overflowY="auto"
          overflowX="hidden"
          gap="2"
        >
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
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
