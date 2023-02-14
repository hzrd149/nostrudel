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
import accountService from "../../services/account";
import { AddIcon } from "../icons";
import { UserAvatar } from "../user-avatar";

function AccountItem({ pubkey }: { pubkey: string }) {
  const metadata = useUserMetadata(pubkey, []);
  const accord = useAccordionContext();

  const handleClick = () => {
    if (accord) accord.setIndex(-1);
    accountService.switchAccount(pubkey);
  };

  return (
    <Box display="flex" gap="4" alignItems="center" cursor="pointer" onClick={handleClick}>
      <UserAvatar pubkey={pubkey} size="sm" />
      <Text flex={1} mr="4" overflow="hidden">
        {getUserDisplayName(metadata, pubkey)}
      </Text>
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
  const accounts = useSubject(accountService.accounts);
  const current = useSubject(accountService.current);

  const otherAccounts = accounts.filter((acc) => acc.pubkey !== current?.pubkey);

  return (
    <Flex gap="2" direction="column" padding="2">
      {otherAccounts.map((account) => (
        <AccountItem key={account.pubkey} pubkey={account.pubkey} />
      ))}
      <Button size="sm" leftIcon={<AddIcon />}>
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
