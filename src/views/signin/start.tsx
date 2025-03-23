import { lazy, useState } from "react";
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  Divider,
  Flex,
  IconButton,
  Link,
  Spinner,
  Text,
  useToast,
} from "@chakra-ui/react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { AmberClipboardAccount, ExtensionAccount, SerialPortAccount } from "applesauce-accounts/accounts";
import { AmberClipboardSigner, ExtensionSigner, SerialPortSigner } from "applesauce-signers";
import { useAccountManager, useAccounts } from "applesauce-react/hooks";

import Key01 from "../../components/icons/key-01";
import Diamond01 from "../../components/icons/diamond-01";
import UsbFlashDrive from "../../components/icons/usb-flash-drive";
import HelpCircle from "../../components/icons/help-circle";

import { CAP_IS_ANDROID, CAP_IS_WEB } from "../../env";
import { AtIcon } from "../../components/icons";
import Package from "../../components/icons/package";
import Eye from "../../components/icons/eye";
import useAsyncAction from "../../hooks/use-async-error-handler";
import UserAvatar from "../../components/user/user-avatar";
import UserName from "../../components/user/user-name";
import UserDnsIdentity from "../../components/user/user-dns-identity";
import { CloseIcon } from "@chakra-ui/icons";
import AccountTypeBadge from "../../components/accounts/account-info-badge";
const AndroidNativeSigners = lazy(() => import("./native"));

export default function LoginStartView() {
  const location = useLocation();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const manager = useAccountManager();
  const accounts = useAccounts();

  const extension = useAsyncAction(async () => {
    if (!window.nostr) throw new Error("Missing NIP-07 signer extension");

    const signer = new ExtensionSigner();
    const pubkey = await signer.getPublicKey();

    const account = new ExtensionAccount(pubkey, signer);
    manager.addAccount(account);
    manager.setActive(account);
  });

  const serial = useAsyncAction(async () => {
    if (!SerialPortSigner.SUPPORTED) throw new Error("Serial is not supported");

    const signer = new SerialPortSigner();
    const pubkey = await signer.getPublicKey();
    const account = new SerialPortAccount(pubkey, signer);
    manager.addAccount(account);
    manager.setActive(account);
  });

  const amber = useAsyncAction(async () => {
    const signer = new AmberClipboardSigner();
    const pubkey = await signer.getPublicKey();
    const account = new AmberClipboardAccount(pubkey, signer);
    manager.addAccount(account);
    manager.setActive(account);
  });

  return (
    <>
      {window.nostr && (
        <Button
          onClick={extension.run}
          isLoading={extension.loading}
          leftIcon={<Key01 boxSize={6} />}
          w="full"
          colorScheme="primary"
        >
          Sign in with extension
        </Button>
      )}
      <Button
        as={RouterLink}
        to="./address"
        state={location.state}
        w="full"
        colorScheme="blue"
        leftIcon={<AtIcon boxSize={6} />}
      >
        Nostr Address
      </Button>
      {SerialPortSigner.SUPPORTED && (
        <ButtonGroup colorScheme="purple">
          <Button onClick={serial.run} isLoading={serial.loading} leftIcon={<UsbFlashDrive boxSize={6} />} w="xs">
            Use Signing Device
          </Button>
          <IconButton
            as={Link}
            aria-label="What is NSD?"
            title="What is NSD?"
            isExternal
            href="https://github.com/lnbits/nostr-signing-device"
            icon={<HelpCircle boxSize={5} />}
          />
        </ButtonGroup>
      )}
      {CAP_IS_WEB && AmberClipboardSigner.SUPPORTED && (
        <ButtonGroup colorScheme="orange" w="full">
          <Button onClick={amber.run} isLoading={amber.loading} leftIcon={<Diamond01 boxSize={6} />} flex={1}>
            Use Amber
          </Button>
          <IconButton
            as={Link}
            aria-label="What is Amber?"
            title="What is Amber?"
            isExternal
            href="https://github.com/greenart7c3/Amber"
            icon={<HelpCircle boxSize={5} />}
          />
        </ButtonGroup>
      )}
      {CAP_IS_ANDROID && <AndroidNativeSigners />}
      <Flex w="full" alignItems="center" gap="4">
        <Divider />
        <Text fontWeight="bold">OR</Text>
        <Divider />
      </Flex>
      <Flex gap="2">
        <Button
          flexDirection="column"
          h="auto"
          p="4"
          as={RouterLink}
          to="./nostr-connect"
          state={location.state}
          variant="outline"
        >
          <Package boxSize={12} />
          Nostr Connect
        </Button>
        <Button
          flexDirection="column"
          h="auto"
          p="4"
          as={RouterLink}
          to="./nsec"
          state={location.state}
          variant="outline"
        >
          <Key01 boxSize={12} />
          Private key
        </Button>
        <Button
          flexDirection="column"
          h="auto"
          p="4"
          as={RouterLink}
          to="./npub"
          state={location.state}
          variant="outline"
        >
          <Eye boxSize={12} />
          Public key
        </Button>
      </Flex>
      {accounts.length > 0 && (
        <>
          <Text fontWeight="bold" mt="4">
            Existing accounts
          </Text>

          {accounts.map((account) => (
            <Card key={account.id} p="2" display="flex" direction="row" gap="2" alignItems="center" w="full" maxW="md">
              <UserAvatar pubkey={account.pubkey} size="md" />
              <Box>
                <UserName pubkey={account.pubkey} />
                <br />
                <AccountTypeBadge account={account} />
              </Box>

              <ButtonGroup ms="auto">
                <Button variant="ghost" onClick={() => manager.setActive(account)}>
                  Sign in
                </Button>
                <IconButton
                  aria-label="Delete account"
                  icon={<CloseIcon />}
                  variant="ghost"
                  colorScheme="red"
                  onClick={() => manager.removeAccount(account)}
                />
              </ButtonGroup>
            </Card>
          ))}
        </>
      )}
      <Text fontWeight="bold" mt="4">
        Don't have an account?
      </Text>
      <Button
        as={RouterLink}
        to="/signup"
        state={location.state}
        colorScheme="primary"
        variant="outline"
        maxW="xs"
        w="full"
      >
        Sign up
      </Button>
    </>
  );
}
