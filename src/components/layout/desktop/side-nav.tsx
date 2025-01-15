import { createContext, useState } from "react";
import {
  Flex,
  FlexProps,
  IconButton,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Spacer,
} from "@chakra-ui/react";

import UserAvatar from "../../user/user-avatar";
import useCurrentAccount from "../../../hooks/use-current-account";
import accountService from "../../../services/account";
import UserName from "../../user/user-name";
import UserDnsIdentity from "../../user/user-dns-identity";
import { ChevronLeftIcon, ChevronRightIcon, SettingsIcon } from "../../icons";
import Plus from "../../icons/plus";
import NavItem from "../nav-items/nav-item";
import NavItems from "../nav-items";
import useRootPadding from "../../../hooks/use-root-padding";

export const ExpandedContext = createContext(false);

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

export default function DesktopSideNav({ ...props }: Omit<FlexProps, "children">) {
  const account = useCurrentAccount();
  const [expanded, setExpanded] = useState(true);

  useRootPadding({ left: expanded ? "var(--chakra-sizes-64)" : "var(--chakra-sizes-16)" });

  return (
    <ExpandedContext.Provider value={expanded}>
      <Flex
        direction="column"
        gap="2"
        px="2"
        py="2"
        shrink={0}
        borderRightWidth={1}
        pt="calc(var(--chakra-space-2) + var(--safe-top))"
        pb="calc(var(--chakra-space-2) + var(--safe-bottom))"
        w={expanded ? "64" : "16"}
        position="fixed"
        left="0"
        bottom="0"
        top="0"
        zIndex="modal"
        overflowY="auto"
        overflowX="hidden"
        {...props}
      >
        <IconButton
          aria-label={expanded ? "Close" : "Open"}
          title={expanded ? "Close" : "Open"}
          size="sm"
          variant="ghost"
          onClick={() => setExpanded(!expanded)}
          icon={expanded ? <ChevronLeftIcon boxSize={5} /> : <ChevronRightIcon boxSize={5} />}
          position="absolute"
          bottom="4"
          right="-4"
        />
        {account && <UserAccount />}
        <NavItem icon={Plus} label="Create new" colorScheme="primary" to="/new" variant="solid" />

        <NavItems />

        <Spacer />
        <NavItem label="Settings" icon={SettingsIcon} to="/settings" />
      </Flex>
    </ExpandedContext.Provider>
  );
}
