import { useState } from "react";
import { Badge, Button, ButtonGroup, Divider, Flex, IconButton, Link, Spinner, Text, useToast } from "@chakra-ui/react";
import { Link as RouterLink, useLocation } from "react-router-dom";

import Key01 from "../../components/icons/key-01";
import Diamond01 from "../../components/icons/diamond-01";
import UsbFlashDrive from "../../components/icons/usb-flash-drive";
import HelpCircle from "../../components/icons/help-circle";

import { COMMON_CONTACT_RELAY } from "../../const";
import accountService from "../../services/account";
import serialPortService from "../../services/serial-port";
import amberSignerService from "../../services/amber-signer";
import { AtIcon } from "../../components/icons";
import { getRelaysFromExt } from "../../helpers/nip07";
import { safeRelayUrls } from "../../helpers/relay";
import Package from "../../components/icons/package";
import Eye from "../../components/icons/eye";

export default function LoginStartView() {
  const location = useLocation();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const signinWithExtension = async () => {
    if (window.nostr) {
      try {
        setLoading(true);

        const pubkey = await window.nostr.getPublicKey();

        if (!accountService.hasAccount(pubkey)) {
          let relays = (await getRelaysFromExt()).read.urls;

          if (relays.length === 0) {
            relays = safeRelayUrls([
              "wss://relay.damus.io/",
              "wss://relay.snort.social/",
              "wss://nostr.wine/",
              COMMON_CONTACT_RELAY,
            ]);
          }

          accountService.addAccount({ pubkey, relays, type: "extension", readonly: false });
        }

        accountService.switchAccount(pubkey);
      } catch (e) {
        if (e instanceof Error) toast({ description: e.message, status: "error" });
      }
      setLoading(false);
    } else {
      toast({ status: "warning", title: "Cant find extension" });
    }
  };
  const signinWithSerial = async () => {
    if (serialPortService.supported) {
      try {
        setLoading(true);

        const pubkey = await serialPortService.getPublicKey();

        if (!accountService.hasAccount(pubkey)) {
          let relays: string[] = [];
          if (relays.length === 0) {
            relays = ["wss://relay.damus.io", "wss://relay.snort.social", "wss://nostr.wine", COMMON_CONTACT_RELAY];
          }

          accountService.addAccount({ pubkey, relays, type: "serial", readonly: false });
        }

        accountService.switchAccount(pubkey);
      } catch (e) {
        if (e instanceof Error) toast({ description: e.message, status: "error" });
      }
      setLoading(false);
    } else {
      toast({ status: "warning", title: "Serial is not supported" });
    }
  };

  const signinWithAmber = async () => {
    try {
      const pubkey = await amberSignerService.getPublicKey();
      if (!accountService.hasAccount(pubkey)) {
        let relays: string[] = [];
        if (relays.length === 0) {
          relays = ["wss://relay.damus.io", "wss://relay.snort.social", "wss://nostr.wine", COMMON_CONTACT_RELAY];
        }

        accountService.addAccount({ pubkey, relays, type: "amber", readonly: false });
      }
      accountService.switchAccount(pubkey);
    } catch (e) {
      if (e instanceof Error) toast({ description: e.message, status: "error" });
    }
  };

  if (loading) return <Spinner />;

  return (
    <>
      {window.nostr && (
        <Button onClick={signinWithExtension} leftIcon={<Key01 boxSize={6} />} w="full" colorScheme="primary">
          Sign in with extension
        </Button>
      )}
      <Button as={RouterLink} to="./address" state={location.state} w="full" colorScheme="blue" leftIcon={<AtIcon />}>
        Nostr Address
      </Button>
      {serialPortService.supported && (
        <ButtonGroup colorScheme="purple">
          <Button onClick={signinWithSerial} leftIcon={<UsbFlashDrive boxSize={6} />} w="xs">
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
      {amberSignerService.supported && (
        <ButtonGroup colorScheme="orange">
          <Button onClick={signinWithAmber} leftIcon={<Diamond01 boxSize={6} />} w="xs">
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
