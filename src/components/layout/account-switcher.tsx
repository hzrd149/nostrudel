import { CloseIcon } from "@chakra-ui/icons";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { Box, Button, ButtonGroup, Flex, IconButton, Text, useDisclosure } from "@chakra-ui/react";

import { getDisplayName } from "../../helpers/nostr/user-metadata";
import useSubject from "../../hooks/use-subject";
import useUserMetadata from "../../hooks/use-user-metadata";
import accountService from "../../services/account";
import { AddIcon, ChevronDownIcon, ChevronUpIcon } from "../icons";
import UserAvatar from "../user/user-avatar";
import AccountTypeBadge from "../account-info-badge";
import useCurrentAccount from "../../hooks/use-current-account";
import { Account } from "../../classes/accounts/account";

function AccountItem({ account, onClick }: { account: Account; onClick?: () => void }) {
  const pubkey = account.pubkey;
  const metadata = useUserMetadata(pubkey, []);

  const handleClick = () => {
    accountService.switchAccount(pubkey);
    if (onClick) onClick();
  };

  return (
    <Box display="flex" gap="2" alignItems="center" cursor="pointer">
      <Flex as="button" onClick={handleClick} flex={1} gap="2" overflow="hidden" alignItems="center">
        <UserAvatar pubkey={pubkey} size="md" />
        <Flex direction="column" overflow="hidden" alignItems="flex-start">
          <Text isTruncated>{getDisplayName(metadata, pubkey)}</Text>
          <AccountTypeBadge fontSize="0.7em" account={account} />
        </Flex>
      </Flex>
      <IconButton
        icon={<CloseIcon />}
        aria-label="Remove Account"
        onClick={(e) => {
          e.stopPropagation();
          if (confirm("Remove this account?")) accountService.removeAccount(pubkey);
        }}
        size="sm"
        variant="ghost"
      />
    </Box>
  );
}

export default function AccountSwitcher() {
  const navigate = useNavigate();
  const account = useCurrentAccount()!;
  const { isOpen, onToggle, onClose } = useDisclosure();
  const metadata = useUserMetadata(account.pubkey);
  const accounts = useSubject(accountService.accounts);

  const otherAccounts = accounts.filter((acc) => acc.pubkey !== account?.pubkey);

  return (
    <Flex direction="column" gap="2">
      <Box
        as="button"
        borderRadius="lg"
        borderWidth={1}
        display="flex"
        gap="2"
        mb="2"
        alignItems="center"
        flexGrow={1}
        onClick={onToggle}
      >
        <UserAvatar pubkey={account.pubkey} noProxy size="md" />
        <Text whiteSpace="nowrap" fontWeight="bold" fontSize="lg" isTruncated>
          {getDisplayName(metadata, account.pubkey)}
        </Text>
        <Flex ml="auto" alignItems="center" justifyContent="center" aspectRatio={1} h="3rem">
          {isOpen ? <ChevronUpIcon fontSize="1.5rem" /> : <ChevronDownIcon fontSize="1.5rem" />}
        </Flex>
      </Box>
      {isOpen && (
        <>
          {otherAccounts.map((account) => (
            <AccountItem key={account.pubkey} account={account} onClick={onClose} />
          ))}
          <ButtonGroup>
            <Button as={RouterLink} to="/settings/accounts" w="full">
              Manage
            </Button>
            <IconButton
              icon={<AddIcon boxSize={6} />}
              aria-label="Add Account"
              onClick={() => {
                accountService.logout(false);
                navigate("/signin", { state: { from: location.pathname } });
              }}
              colorScheme="primary"
            >
              Add Account
            </IconButton>
          </ButtonGroup>
        </>
      )}
    </Flex>
  );
}
