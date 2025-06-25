import { Box, Button, ButtonGroup, Divider, Flex, Heading, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { PasswordSigner, SerialPortSigner, SimpleSigner } from "applesauce-signers";
import { useAccountManager, useAccounts } from "applesauce-react/hooks";

import { useActiveAccount } from "applesauce-react/hooks";
import UserAvatar from "../../../components/user/user-avatar";
import UserName from "../../../components/user/user-name";
import UserDnsIdentity from "../../../components/user/user-dns-identity";
import AccountTypeBadge from "../../../components/accounts/account-info-badge";
import SimpleSignerBackup from "./components/simple-signer-backup";
import MigrateAccountToDevice from "./components/migrate-to-device";
import SimpleView from "../../../components/layout/presets/simple-view";
import RouterLink from "../../../components/router-link";
import { IAccount } from "applesauce-accounts";

function AccountBackup() {
  const account = useActiveAccount()!;

  return (
    <>
      {account.signer instanceof SimpleSigner && account.signer.key && <SimpleSignerBackup />}
      {account.signer instanceof PasswordSigner && account.signer.ncryptsec && <SimpleSignerBackup />}
      {(account.signer instanceof SimpleSigner || account.signer instanceof PasswordSigner) &&
        SerialPortSigner.SUPPORTED && <MigrateAccountToDevice />}
    </>
  );
}

function AccountCard({ account }: { account: IAccount }) {
  const manager = useAccountManager();

  return (
    <Flex gap="2" alignItems="center" wrap="wrap" key={account.pubkey}>
      <UserAvatar pubkey={account.pubkey} />
      <Box lineHeight={1}>
        <Heading size="md">
          <UserName pubkey={account.pubkey} />
        </Heading>
        <AccountTypeBadge account={account} />
      </Box>

      <ButtonGroup size="sm" ml="auto">
        <Button onClick={() => manager.setActive(account)} variant="ghost">
          Switch
        </Button>
        <Button onClick={() => confirm("Remove account?") && manager.removeAccount(account)} colorScheme="red">
          Remove
        </Button>
      </ButtonGroup>
    </Flex>
  );
}

export default function AccountSettings() {
  const account = useActiveAccount()!;
  const accounts = useAccounts();
  const manager = useAccountManager();
  const navigate = useNavigate();

  const signout = () => {
    if (manager.active) {
      manager.removeAccount(manager.active);
      manager.clearActive();
    }
  };

  return (
    <SimpleView title="Accounts" maxW="6xl">
      <Flex gap="2" alignItems="center" wrap="wrap">
        <UserAvatar pubkey={account.pubkey} />
        <Box lineHeight={1}>
          <Heading size="md">
            <UserName pubkey={account.pubkey} />
          </Heading>
          <AccountTypeBadge account={account} />
        </Box>

        <ButtonGroup ms="auto">
          <Button as={RouterLink} to="/settings/profile" variant="ghost">
            Edit Profile
          </Button>
          <Button onClick={signout}>Signout</Button>
        </ButtonGroup>
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
          <AccountCard key={account.id} account={account} />
        ))}
      <Button
        colorScheme="primary"
        mt="10"
        w="full"
        maxW="xl"
        mx="auto"
        onClick={() => {
          manager.clearActive();
          navigate("/signin", { state: { from: location.pathname } });
        }}
      >
        Add Account
      </Button>
    </SimpleView>
  );
}
