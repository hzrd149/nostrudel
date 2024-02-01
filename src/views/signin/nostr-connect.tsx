import { useState } from "react";
import { Button, Flex, FormControl, FormHelperText, FormLabel, Input, Text, useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import accountService from "../../services/account";
import nostrConnectService, { NostrConnectClient } from "../../services/nostr-connect";

export default function LoginNostrConnectView() {
  const navigate = useNavigate();
  const toast = useToast();
  const [uri, setUri] = useState("");

  const [loading, setLoading] = useState<string | undefined>();
  const handleSubmit: React.FormEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();

    try {
      setLoading("Connecting...");
      let client: NostrConnectClient;
      if (uri.startsWith("bunker://")) {
        if (uri.includes("@")) client = nostrConnectService.fromBunkerAddress(uri);
        else client = nostrConnectService.fromBunkerURI(uri);

        await client.connect();
      } else if (uri.startsWith("npub")) {
        client = nostrConnectService.fromBunkerToken(uri);
        const [npub, hexToken] = uri.split("#");
        await client.connect(hexToken);
      } else throw new Error("Unknown format");

      nostrConnectService.saveClient(client);
      accountService.addAccount({
        type: "nostr-connect",
        signerRelays: client.relays,
        clientSecretKey: client.secretKey,
        pubkey: client.pubkey,
        readonly: false,
      });
      accountService.switchAccount(client.pubkey);
    } catch (e) {
      if (e instanceof Error) toast({ status: "error", description: e.message });
    }
    setLoading(undefined);
  };

  return (
    <Flex as="form" direction="column" gap="4" onSubmit={handleSubmit} w="full">
      {loading && <Text fontSize="lg">{loading}</Text>}
      {!loading && (
        <FormControl>
          <FormLabel>Connect URI</FormLabel>
          <Input
            name="nostr-address"
            placeholder="bunker://<pubkey>?relay=wss://relay.example.com"
            isRequired
            value={uri}
            onChange={(e) => setUri(e.target.value)}
            autoComplete="off"
          />
          <FormHelperText>A bunker connect URI</FormHelperText>
        </FormControl>
      )}
      <Flex justifyContent="space-between" gap="2">
        <Button variant="link" onClick={() => navigate("../")}>
          Back
        </Button>
        <Button colorScheme="primary" ml="auto" type="submit" isLoading={!!loading}>
          Connect
        </Button>
      </Flex>
    </Flex>
  );
}
