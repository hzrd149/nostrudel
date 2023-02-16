import { useState } from "react";
import { Button, Flex, FormControl, FormHelperText, FormLabel, Input, Link, useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { RelayUrlInput } from "../../components/relay-url-input";
import { normalizeToHex } from "../../helpers/nip-19";
import accountService from "../../services/account";
import clientRelaysService from "../../services/client-relays";

export const LoginNpubView = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [npub, setNpub] = useState("");
  const [relayUrl, setRelayUrl] = useState("");

  const handleSubmit: React.FormEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();

    const pubkey = normalizeToHex(npub);
    if (!pubkey) {
      return toast({ status: "error", title: "Invalid npub" });
    }

    if (!accountService.hasAccount(pubkey)) {
      accountService.addAccount({ pubkey, relays: [relayUrl], readonly: true });
    }
    accountService.switchAccount(pubkey);

    clientRelaysService.bootstrapRelays.add(relayUrl);
  };

  return (
    <Flex as="form" direction="column" gap="4" onSubmit={handleSubmit} minWidth="350">
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
        <Button colorScheme="brand" ml="auto" type="submit">
          Login
        </Button>
      </Flex>
    </Flex>
  );
};
