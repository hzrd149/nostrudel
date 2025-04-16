import { Link as RouterLink } from "react-router-dom";
import { Flex, IconButton } from "@chakra-ui/react";

import { useActiveAccount } from "applesauce-react/hooks";
import { useContext } from "react";
import UserDnsIdentity from "../../user/user-dns-identity";
import NavItem from "./nav-item";
import LogIn01 from "../../icons/log-in-01";
import { CollapsedContext } from "../context";
import Users02 from "../../icons/users-02";
import UserAvatarLink from "../../user/user-avatar-link";
import UserLink from "../../user/user-link";

export default function AccountSwitcher() {
  const account = useActiveAccount();

  const collapsed = useContext(CollapsedContext);

  return (
    <>
      {account ? (
        <Flex gap="2" alignItems="center" flexShrink={0} overflow="hidden">
          <UserAvatarLink pubkey={account.pubkey} noProxy size="md" />
          {!collapsed && (
            <>
              <Flex overflow="hidden" direction="column" w="Full" alignItems="flex-start">
                <UserLink pubkey={account.pubkey} fontWeight="bold" isTruncated whiteSpace="nowrap" />
                <UserDnsIdentity pubkey={account.pubkey} />
              </Flex>
              <IconButton
                as={RouterLink}
                to="/settings/accounts"
                ms="auto"
                aria-label="Switch account"
                flexShrink={0}
                size="md"
                variant="ghost"
                icon={<Users02 boxSize={5} />}
              />
            </>
          )}
        </Flex>
      ) : (
        <NavItem label="Signin" icon={LogIn01} to="/signin" colorScheme="primary" variant="solid" />
      )}
    </>
  );
}
