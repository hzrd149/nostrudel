import { useState } from "react";
import { Button, Flex, FormControl, FormHelperText, FormLabel, Input, Link, useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import { RelayUrlInput } from "../../components/relay-url-input";
import { normalizeToHexPubkey } from "../../helpers/nip19";
import accountService from "../../services/account";
import { COMMON_CONTACT_RELAY } from "../../const";

export default function LoginNpubView() {
  const navigate = useNavigate();
  const toast = useToast();
  const [npub, setNpub] = useState("");
  const [relayUrl, setRelayUrl] = useState(COMMON_CONTACT_RELAY);

  const handleSubmit: React.FormEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();

    const pubkey = normalizeToHexPubkey(npub);
    if (!pubkey) {
      return toast({ status: "error", title: "Invalid npub" });
    }

    if (!accountService.hasAccount(pubkey)) {
      accountService.addAccount({ type: "pubkey", pubkey, relays: [relayUrl], readonly: true });
    }
    accountService.switchAccount(pubkey);
  };

  return (
    <Flex as="form" direction="column" gap="4" onSubmit={handleSubmit} minWidth="350" w="full">
      <FormControl>
        <FormLabel>Enter user npub</FormLabel>
        <Input type="text" placeholder="npub1" isRequired value={npub} onChange={(e) => setNpub(e.target.value)} />
        <FormHelperText>
          Enter any npub you want.{" "}
          <Link isExternal href="https://nostr.directory" color="blue.500" target="_blank">
            nostr.directory
          </Link>
        </FormHelperText>
      </FormControl>
      <FormControl>
        <FormLabel>Bootstrap relay</FormLabel>
        <RelayUrlInput
          placeholder="wss://nostr.example.com"
          isRequired
          value={relayUrl}
          onChange={(e) => setRelayUrl(e.target.value)}
        />
        <FormHelperText>The first relay to connect to.</FormHelperText>
      </FormControl>
      <Flex justifyContent="space-between" gap="2">
        <Button variant="link" onClick={() => navigate("../")}>
          Back
        </Button>
        <Button colorScheme="primary" ml="auto" type="submit">
          Login
        </Button>
      </Flex>
    </Flex>
  );
}
