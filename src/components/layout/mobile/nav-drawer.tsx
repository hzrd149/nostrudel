import { MouseEventHandler } from "react";
import {
  Avatar,
  ButtonGroup,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerOverlay,
  DrawerProps,
  Flex,
  Text,
  DrawerHeader,
} from "@chakra-ui/react";
import { useActiveAccount } from "applesauce-react/hooks";

import AccountSwitcher from "../components/account-switcher";
import NavItems from "../components";
import { CollapsedContext } from "../context";
import RelayConnectionButton from "../components/connections-button";
import PublishLogButton from "../components/publish-log-button";

export default function NavDrawer({ onClose, ...props }: Omit<DrawerProps, "children">) {
  const account = useActiveAccount();

  const handleClickItem: MouseEventHandler = (e) => {
    if (e.target instanceof HTMLAnchorElement || e.target instanceof HTMLButtonElement) {
      onClose();
    }
  };

  return (
    <Drawer placement="left" onClose={onClose} aria-label="Main navigation menu" returnFocusOnClose={true} {...props}>
      <DrawerOverlay />
      <DrawerContent role="navigation">
        <CollapsedContext.Provider value={false}>
          <DrawerBody
            display="flex"
            flexDirection="column"
            px="4"
            pt="4"
            overflowY="auto"
            overflowX="hidden"
            gap="2"
            onClick={handleClickItem}
            mt="var(--safe-top)"
            mb="var(--safe-bottom)"
          >
            {!account && (
              <Flex gap="2" alignItems="center">
                <Avatar src="/apple-touch-icon.png" size="md" aria-label="Nostrudel logo" />
                <Text as="h1" m={0} fontSize="xl">
                  Nostrudel
                </Text>
              </Flex>
            )}
            <AccountSwitcher />
            <NavItems />
            <ButtonGroup variant="ghost" onClick={onClose} aria-label="Relay connections">
              <RelayConnectionButton w="full" />
              <PublishLogButton flexShrink={0} />
            </ButtonGroup>
          </DrawerBody>
        </CollapsedContext.Provider>
      </DrawerContent>
    </Drawer>
  );
}
