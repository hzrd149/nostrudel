import { Flex, IconButton, Menu, MenuButton, MenuDivider, MenuItem, MenuList } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import UserAvatar from "../../user/user-avatar";
import useCurrentAccount from "../../../hooks/use-current-account";
import accountService from "../../../services/account";
import UserName from "../../user/user-name";
import UserDnsIdentity from "../../user/user-dns-identity";
import { DirectMessagesIcon, SettingsIcon, SearchIcon, RelayIcon } from "../../icons";
import Home05 from "../../icons/home-05";

function UserAccount() {
  const account = useCurrentAccount()!;

  return (
    <Menu placement="right" offset={[32, 16]}>
      <MenuButton
        as={IconButton}
        variant="outline"
        w="12"
        h="12"
        borderRadius="50%"
        icon={<UserAvatar pubkey={account.pubkey} />}
      />
      <MenuList boxShadow="lg">
        <Flex gap="2" px="2" alignItems="center">
          <UserAvatar pubkey={account.pubkey} />
          <Flex direction="column">
            <UserName pubkey={account.pubkey} fontSize="xl" />
            <UserDnsIdentity pubkey={account.pubkey} />
          </Flex>
        </Flex>
        <MenuDivider />
        <MenuItem onClick={() => accountService.logout()}>Logout</MenuItem>
      </MenuList>
    </Menu>
  );
}

export default function DesktopSideNav() {
  const account = useCurrentAccount();

  return (
    <Flex
      direction="column"
      gap="2"
      px="2"
      py="2"
      shrink={0}
      borderRightWidth={1}
      pt="calc(var(--chakra-space-2) + var(--safe-top))"
      pb="calc(var(--chakra-space-2) + var(--safe-bottom))"
    >
      {account && <UserAccount />}
      <IconButton
        as={RouterLink}
        aria-label="Search"
        title="Search"
        icon={<Home05 boxSize={5} />}
        w="12"
        h="12"
        fontSize="24"
        variant="outline"
        to="/"
      />
      <IconButton
        as={RouterLink}
        aria-label="Search"
        title="Search"
        icon={<SearchIcon boxSize={5} />}
        w="12"
        h="12"
        fontSize="24"
        variant="outline"
        to="/search"
      />
      <IconButton
        as={RouterLink}
        aria-label="Messages"
        title="Messages"
        icon={<DirectMessagesIcon boxSize={5} />}
        w="12"
        h="12"
        fontSize="24"
        variant="outline"
        to="/messages"
      />
      <IconButton
        w="12"
        h="12"
        as={RouterLink}
        aria-label="Network"
        title="Network"
        icon={<RelayIcon boxSize={6} />}
        variant="outline"
        to="/network"
      />
      <IconButton
        as={RouterLink}
        w="12"
        h="12"
        aria-label="Settings"
        title="Settings"
        mt="auto"
        variant="outline"
        icon={<SettingsIcon boxSize={5} />}
        to="/settings"
      />
      {/* {explore.isOpen && <ExploreCommunitiesModal isOpen onClose={explore.onClose} />} */}
    </Flex>
  );
}
