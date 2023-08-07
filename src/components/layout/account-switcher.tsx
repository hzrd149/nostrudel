import { CloseIcon } from "@chakra-ui/icons";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Flex,
  IconButton,
  Text,
  useAccordionContext,
} from "@chakra-ui/react";
import { getUserDisplayName } from "../../helpers/user-metadata";
import useSubject from "../../hooks/use-subject";
import { useUserMetadata } from "../../hooks/use-user-metadata";
import accountService, { Account } from "../../services/account";
import { AddIcon } from "../icons";
import { UserAvatar } from "../user-avatar";
import { useLocation, useNavigate } from "react-router-dom";
import AccountInfoBadge from "../account-info-badge";

function AccountItem({ account }: { account: Account }) {
  const pubkey = account.pubkey;
  const metadata = useUserMetadata(pubkey, []);
  const accord = useAccordionContext();

  const handleClick = () => {
    if (accord) accord.setIndex(-1);
    accountService.switchAccount(pubkey);
  };

  return (
    <Box display="flex" gap="4" alignItems="center" cursor="pointer" onClick={handleClick}>
      <UserAvatar pubkey={pubkey} size="sm" />
      <Box flex={1}>
        <Text isTruncated>{getUserDisplayName(metadata, pubkey)}</Text>
        <AccountInfoBadge fontSize="0.7em" account={account} />
      </Box>
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

export function AccountSwitcherList() {
  const navigate = useNavigate();
  const accounts = useSubject(accountService.accounts);
  const current = useSubject(accountService.current);
  const location = useLocation();

  const otherAccounts = accounts.filter((acc) => acc.pubkey !== current?.pubkey);

  return (
    <Flex gap="2" direction="column" padding="2">
      {otherAccounts.map((account) => (
        <AccountItem key={account.pubkey} account={account} />
      ))}
      <Button
        size="sm"
        leftIcon={<AddIcon />}
        onClick={() => {
          accountService.logout();
          navigate("/login", { state: { from: location.pathname } });
        }}
      >
        Add Account
      </Button>
    </Flex>
  );
}

export default function AccountSwitcher() {
  return (
    <Accordion allowToggle>
      <AccordionItem>
        <h2>
          <AccordionButton>
            <Box as="span" flex="1" textAlign="left">
              Accounts
            </Box>
            <AccordionIcon />
          </AccordionButton>
        </h2>
        <AccordionPanel padding={0}>
          <AccountSwitcherList />
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}
