import { Avatar, Drawer, DrawerBody, DrawerContent, DrawerOverlay, DrawerProps, Flex, Text } from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";

import AccountSwitcher from "../nav-items/account-switcher";
import NavItems from "../nav-items";
import { CollapsedContext } from "../context";

export default function NavDrawer({ ...props }: Omit<DrawerProps, "children">) {
  const account = useActiveAccount();

  return (
    <Drawer placement="left" {...props}>
      <DrawerOverlay />
      <DrawerContent>
        <CollapsedContext.Provider value={false}>
          <DrawerBody display="flex" flexDirection="column" px="4" pt="4" overflowY="auto" overflowX="hidden" gap="2">
            {!account && (
              <Flex gap="2" my="2" alignItems="center">
                <Avatar src="/apple-touch-icon.png" size="md" />
                <Text m={0}>Nostrudel</Text>
              </Flex>
            )}
            <AccountSwitcher />
            <NavItems />
          </DrawerBody>
        </CollapsedContext.Provider>
      </DrawerContent>
    </Drawer>
  );
}
