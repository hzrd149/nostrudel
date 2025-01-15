import {
  Box,
  Button,
  Center,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  ModalProps,
  Spacer,
  Text,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { IconButton } from "@chakra-ui/react";
import { useObservable } from "applesauce-react/hooks";

import { UserAvatar } from "../../user/user-avatar";
import useCurrentAccount from "../../../hooks/use-current-account";
import UserName from "../../user/user-name";
import UserDnsIdentity from "../../user/user-dns-identity";
import { DirectMessagesIcon, RelayIcon, SearchIcon, SettingsIcon } from "../../icons";
import { bakery$ } from "../../../services/bakery";

export default function DrawerNav({ isOpen, onClose, ...props }: Omit<ModalProps, "children">) {
  const account = useCurrentAccount();
  const bakery = useObservable(bakery$);

  return (
    <Drawer placement="left" onClose={onClose} isOpen={isOpen} {...props}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader borderBottomWidth="1px" display="flex" gap="2" p="4">
          {account ? (
            <>
              <UserAvatar pubkey={account.pubkey} />
              <Box flex={1}>
                <UserName pubkey={account.pubkey} isTruncated />
                <Text fontSize="sm" fontWeight="normal" isTruncated>
                  <UserDnsIdentity pubkey={account.pubkey} />
                </Text>
              </Box>
              <IconButton
                as={RouterLink}
                w="10"
                h="10"
                aria-label="Settings"
                title="Settings"
                variant="outline"
                icon={<SettingsIcon boxSize={5} />}
                to="/settings"
              />
              {/* <ColorModeButton variant="ghost" /> */}
            </>
          ) : (
            <Button as={RouterLink} to="/login">
              Login
            </Button>
          )}
        </DrawerHeader>
        <DrawerBody p="0" display="flex" flexDirection="column">
          <Flex as={RouterLink} to="/search" alignItems="center" p="2" gap="2" tabIndex={0} cursor="pointer">
            <Center w="10" h="10">
              <SearchIcon boxSize={5} />
            </Center>
            <Text fontWeight="bold">Search</Text>
          </Flex>
          <Flex as={RouterLink} to="/messages" alignItems="center" p="2" gap="2" tabIndex={0} cursor="pointer">
            <Center w="10" h="10">
              <DirectMessagesIcon boxSize={5} />
            </Center>
            <Text fontWeight="bold">Messages</Text>
          </Flex>
          <Flex as={RouterLink} to="/network" alignItems="center" p="2" gap="2" tabIndex={0} cursor="pointer">
            <Center w="10" h="10">
              <RelayIcon boxSize={6} />
            </Center>
            <Text fontWeight="bold">My Network</Text>
          </Flex>
          <Spacer />
          {bakery && (
            <Button variant="link" p="4" w="full" as={RouterLink} to="/dashboard">
              Bakery
            </Button>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
