import { Box, Button, ButtonGroup, Divider, Flex, Heading, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { PasswordSigner, SerialPortSigner, SimpleSigner } from "applesauce-signer";
import { useObservable } from "applesauce-react/hooks";

import useCurrentAccount from "../../../hooks/use-current-account";
import UserAvatar from "../../../components/user/user-avatar";
import UserName from "../../../components/user/user-name";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import accountService from "../../../services/account";
import AccountTypeBadge from "../../../components/account-info-badge";
import SimpleSignerBackup from "./components/simple-signer-backup";
import MigrateAccountToDevice from "./components/migrate-to-device";
import SimpleView from "../../../components/layout/presets/simple-view";

function AccountBackup() {
  const account = useCurrentAccount()!;

  return (
    <>
      {account.signer instanceof SimpleSigner && account.signer.key && <SimpleSignerBackup />}
      {account.signer instanceof PasswordSigner && account.signer.ncryptsec && <SimpleSignerBackup />}
      {(account.signer instanceof SimpleSigner || account.signer instanceof PasswordSigner) &&
        SerialPortSigner.SUPPORTED && <MigrateAccountToDevice />}
    </>
  );
}

export default function AccountSettings() {
  const account = useCurrentAccount()!;
  const accounts = useObservable(accountService.accounts);
  const navigate = useNavigate();

  return (
    <SimpleView
      title="Account settings"
      maxW="6xl"
      actions={
        <Button
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
      }
    >
      <Flex gap="2" alignItems="center" wrap="wrap">
        <UserAvatar pubkey={account.pubkey} />
        <Box lineHeight={1}>
          <Heading size="md">
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
              <Heading size="md">
                <UserName pubkey={account.pubkey} />
              </Heading>
              <UserDnsIdentity pubkey={account.pubkey} />
            </Box>
            <AccountTypeBadge account={account} ml="4" />

            <ButtonGroup size="sm" ml="auto">
              <Button onClick={() => accountService.switchAccount(account.pubkey)} variant="ghost">
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
    </SimpleView>
  );
}
