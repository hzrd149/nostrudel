import { useState } from "react";
import { Button, Flex, FormControl, FormHelperText, FormLabel, Input, Link, useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { RelayUrlInput } from "../../components/relay-url-input";
import { normalizeToHex } from "../../helpers/nip-19";
import identity from "../../services/identity";
import settings from "../../services/settings";

export const LoginNpubView = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [npub, setNpub] = useState("");
  const [relay, setRelay] = useState("");

  const handleSubmit: React.FormEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();

    const pubkey = normalizeToHex(npub);
    if (!pubkey) {
      return toast({ status: "error", title: "Invalid npub" });
    }

    identity.loginWithPubkey(pubkey);
    // TODO: the settings service should not be in charge of the relays
    if (!settings.relays.value.includes(relay)) {
      settings.relays.next([...settings.relays.value, relay]);
    }
  };

  return (
    <Flex as="form" direction="column" gap="4" onSubmit={handleSubmit}>
      <Button variant="link" onClick={() => navigate("../")}>
        Back
      </Button>
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
          value={relay}
          onChange={(e) => setRelay(e.target.value)}
        />
        <FormHelperText>The first relay to connect to.</FormHelperText>
      </FormControl>
      <Button colorScheme="brand" ml="auto" type="submit">
        Login
      </Button>
    </Flex>
  );
};
