import { useState } from "react";
import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  Input,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import accountService from "../../services/account";
import nostrConnectService, { NostrConnectClient } from "../../services/nostr-connect";
import QRCodeScannerButton from "../../components/qr-code/qr-code-scanner-button";

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
        
        await client.connect(client.secretKey);
      } else if (uri.startsWith("npub")) {
        client = nostrConnectService.fromBunkerToken(uri);
        const [npub, hexToken] = uri.split("#");
        await client.connect(hexToken);
      } else throw new Error("Unknown format");

      nostrConnectService.saveClient(client);
      accountService.addFromNostrConnect(client);
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
          <FormLabel htmlFor="input">Connect URI</FormLabel>
          <Flex gap="2">
            <Input
              id="nostr-connect"
              name="nostr-connect"
              placeholder="bunker://<pubkey>?relay=wss://relay.example.com"
              isRequired
              value={uri}
              onChange={(e) => setUri(e.target.value)}
              autoComplete="off"
            />
            <QRCodeScannerButton onData={(v) => setUri(v)} />
          </Flex>
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
