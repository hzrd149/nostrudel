import { useState } from "react";
import { Badge, Button, Flex, Spinner, Text, useDisclosure, useToast } from "@chakra-ui/react";
import { Link as RouterLink, useLocation } from "react-router-dom";

import accountService from "../../services/account";
import Key01 from "../../components/icons/key-01";
import ChevronDown from "../../components/icons/chevron-down";
import ChevronUp from "../../components/icons/chevron-up";

export default function LoginStartView() {
  const location = useLocation();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const advanced = useDisclosure();

  const signinWithExtension = async () => {
    if (window.nostr) {
      try {
        setLoading(true);

        const pubkey = await window.nostr.getPublicKey();

        if (!accountService.hasAccount(pubkey)) {
          let relays: string[] = [];
          const extRelays = (await window.nostr.getRelays?.()) ?? [];
          if (Array.isArray(extRelays)) {
            relays = extRelays;
          } else {
            relays = Object.keys(extRelays).filter((url) => extRelays[url].read);
          }

          if (relays.length === 0) {
            relays = ["wss://relay.damus.io", "wss://relay.snort.social", "wss://nostr.wine"];
          }

          accountService.addAccount({ pubkey, relays, useExtension: true, readonly: false });
        }

        accountService.switchAccount(pubkey);
      } catch (e) {}
      setLoading(false);
    } else {
      toast({
        status: "warning",
        title: "Cant find extension",
      });
    }
  };

  if (loading) return <Spinner />;

  return (
    <Flex direction="column" gap="2" flexShrink={0} alignItems="center">
      <Button onClick={signinWithExtension} leftIcon={<Key01 boxSize={6} />} w="sm" colorScheme="primary">
        Sign in with extension
      </Button>
      <Button
        variant="link"
        onClick={advanced.onToggle}
        mt="2"
        w="sm"
        rightIcon={advanced.isOpen ? <ChevronUp /> : <ChevronDown />}
      >
        Show Advanced
      </Button>
      {advanced.isOpen && (
        <>
          <Button as={RouterLink} to="./nip05" state={location.state} w="sm">
            NIP05
            <Badge ml="2" colorScheme="blue">
              read-only
            </Badge>
          </Button>
          <Button as={RouterLink} to="./npub" state={location.state} w="sm">
            public key (npub)
            <Badge ml="2" colorScheme="blue">
              read-only
            </Badge>
          </Button>
          <Button as={RouterLink} to="./nsec" state={location.state} w="sm">
            secret key (nsec)
          </Button>
        </>
      )}
      <Text fontWeight="bold" mt="4">
        Don't have an account?
      </Text>
      <Button as={RouterLink} to="/signup" state={location.state}>
        Sign up
      </Button>
    </Flex>
  );
}
