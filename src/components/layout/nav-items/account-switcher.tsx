import { CloseIcon } from "@chakra-ui/icons";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  useDisclosure,
} from "@chakra-ui/react";

import { getDisplayName } from "../../../helpers/nostr/profile";
import useUserProfile from "../../../hooks/use-user-profile";
import accountService from "../../../services/account";
import { LogoutIcon } from "../../icons";
import UserAvatar from "../../user/user-avatar";
import AccountTypeBadge from "../../account-info-badge";
import useCurrentAccount from "../../../hooks/use-current-account";
import { Account } from "../../../classes/accounts/account";
import { useObservable } from "applesauce-react/hooks";
import { useContext } from "react";
import UserDnsIdentity from "../../user/user-dns-identity";
import NavItem from "./nav-item";
import LogIn01 from "../../icons/log-in-01";
import { CollapsedContext } from "../context";

function AccountItem({ account, onClick }: { account: Account; onClick?: () => void }) {
  const pubkey = account.pubkey;
  const metadata = useUserProfile(pubkey, []);

  const handleClick = () => {
    accountService.switchAccount(pubkey);
    if (onClick) onClick();
  };

  return (
    <Box display="flex" gap="2" alignItems="center">
      <Flex flex={1} gap="2" overflow="hidden" alignItems="center">
        <UserAvatar pubkey={pubkey} size="md" />
        <Flex direction="column" overflow="hidden" alignItems="flex-start">
          <Text isTruncated>{getDisplayName(metadata, pubkey)}</Text>
          <AccountTypeBadge fontSize="0.7em" account={account} />
        </Flex>
      </Flex>
      <ButtonGroup size="sm" variant="ghost">
        <Button onClick={handleClick} aria-label="Switch account">
          Switch
        </Button>
        <IconButton
          icon={<CloseIcon />}
          aria-label="Remove account"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Remove this account?")) accountService.removeAccount(pubkey);
          }}
          colorScheme="red"
        />
      </ButtonGroup>
    </Box>
  );
}

export default function AccountSwitcher() {
  const account = useCurrentAccount();
  const modal = useDisclosure();

  const metadata = useUserProfile(account?.pubkey);
  const accounts = useObservable(accountService.accounts);

  const otherAccounts = accounts.filter((acc) => acc.pubkey !== account?.pubkey);
  const collapsed = useContext(CollapsedContext);

  return (
    <>
      {account ? (
        <Flex
          as="button"
          gap="2"
          alignItems="center"
          onClick={modal.onToggle}
          flexShrink={0}
          overflow="hidden"
          outline="none"
        >
          <UserAvatar pubkey={account.pubkey} noProxy size="md" />
          {!collapsed && (
            <Flex overflow="hidden" direction="column" w="Full" alignItems="flex-start">
              <Text whiteSpace="nowrap" fontWeight="bold" fontSize="lg" isTruncated>
                {getDisplayName(metadata, account.pubkey)}
              </Text>
              <UserDnsIdentity pubkey={account.pubkey} />
            </Flex>
          )}
        </Flex>
      ) : (
        <NavItem label="Login" icon={LogIn01} to="/signin" colorScheme="primary" variant="solid" />
      )}

      <Modal isOpen={modal.isOpen} onClose={modal.onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader py="2" px="4">
            Accounts
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb="2" pt="0" px="2" display="flex" flexDirection="column" gap="2">
            {otherAccounts.map((account) => (
              <AccountItem key={account.pubkey} account={account} onClick={modal.onClose} />
            ))}
            <ButtonGroup w="full">
              <Button as={RouterLink} to="/settings/accounts" w="full" onClick={modal.onClose} variant="link">
                Manage accounts
              </Button>
              <Button
                leftIcon={<LogoutIcon boxSize={5} />}
                aria-label="Logout"
                onClick={() => {
                  accountService.logout(false);
                }}
                flexShrink={0}
              >
                Logout
              </Button>
            </ButtonGroup>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
