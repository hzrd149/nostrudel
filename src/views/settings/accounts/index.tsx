import { Box, Button, ButtonGroup, Divider, Flex, Heading, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { SimpleSigner } from "applesauce-signer";

import VerticalPageLayout from "../../../components/vertical-page-layout";
import useCurrentAccount from "../../../hooks/use-current-account";
import UserAvatar from "../../../components/user/user-avatar";
import UserName from "../../../components/user/user-name";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import accountService from "../../../services/account";
import AccountTypeBadge from "../../../components/account-info-badge";
import useSubject from "../../../hooks/use-subject";
import PasswordSigner from "../../../classes/signers/password-signer";
import SimpleSignerBackup from "./simple-signer-backup";
import PasswordSignerBackup from "./password-signer-backup";

function AccountBackup() {
  const account = useCurrentAccount()!;

  if (account.signer instanceof PasswordSigner && account.signer.ncryptsec) {
    return <PasswordSignerBackup />;
  }

  if (account.signer instanceof SimpleSigner && account.signer.key) {
    return <SimpleSignerBackup />;
  }

  return null;
}

export default function AccountSettings() {
  const account = useCurrentAccount()!;
  const accounts = useSubject(accountService.accounts);
  const navigate = useNavigate();

  return (
    <VerticalPageLayout flex={1}>
      <Flex gap="2" alignItems="center">
        <Heading size="md">Account Settings</Heading>
        <Button
          variant="outline"
          colorScheme="primary"
          ml="auto"
          size="sm"
          onClick={() => {
            accountService.logout(false);
            navigate("/signin", { state: { from: location.pathname } });
          }}
        >
          Add Account
        </Button>
      </Flex>

      <Flex gap="2" alignItems="center" wrap="wrap">
        <UserAvatar pubkey={account.pubkey} />
        <Box lineHeight={1}>
          <Heading size="lg">
            <UserName pubkey={account.pubkey} />
          </Heading>
          <UserDnsIdentity pubkey={account.pubkey} />
        </Box>
        <AccountTypeBadge account={account} ml="4" />

        <Button onClick={() => accountService.logout()} ml="auto">
          Logout
        </Button>
      </Flex>

      <AccountBackup />

      <Flex gap="2" px="4" alignItems="Center" mt="4">
        <Divider />
        <Text fontWeight="bold" fontSize="md" whiteSpace="pre">
          Other Accounts
        </Text>
        <Divider />
      </Flex>

      {accounts
        .filter((a) => a.pubkey !== account.pubkey)
        .map((account) => (
          <Flex gap="2" alignItems="center" wrap="wrap" key={account.pubkey}>
            <UserAvatar pubkey={account.pubkey} />
            <Box lineHeight={1}>
              <Heading size="lg">
                <UserName pubkey={account.pubkey} />
              </Heading>
              <UserDnsIdentity pubkey={account.pubkey} />
            </Box>
            <AccountTypeBadge account={account} ml="4" />

            <ButtonGroup size="sm" ml="auto">
              <Button
                onClick={() => accountService.switchAccount(account.pubkey)}
                colorScheme="primary"
                variant="ghost"
              >
                Switch
              </Button>
              <Button
                onClick={() => confirm("Remove account?") && accountService.removeAccount(account)}
                colorScheme="red"
              >
                Remove
              </Button>
            </ButtonGroup>
          </Flex>
        ))}
    </VerticalPageLayout>
  );
}
