import { useState } from "react";
import { Button, Divider, Flex, FormControl, FormHelperText, FormLabel, Input, Text, useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { NostrConnectSigner } from "applesauce-signers/signers/nostr-connect-signer";
import { useAccountManager } from "applesauce-react/hooks";
import { NostrConnectAccount } from "applesauce-accounts/accounts";

import { NOSTR_CONNECT_PERMISSIONS } from "../../../const";
import QRCodeScannerButton from "../../../components/qr-code/qr-code-scanner-button";
import RouterLink from "../../../components/router-link";

export default function SigninConnectView() {
  const navigate = useNavigate();
  const toast = useToast();
  const [connection, setConnection] = useState("");
  const manager = useAccountManager();

  const [loading, setLoading] = useState<string | undefined>();
  const handleSubmit: React.FormEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();

    try {
      setLoading("Connecting...");
      const signer = await NostrConnectSigner.fromBunkerURI(connection, {
        permissions: NOSTR_CONNECT_PERMISSIONS,
      });
      const pubkey = await signer.getPublicKey();

      const account = new NostrConnectAccount(pubkey, signer);
      manager.addAccount(account);
      manager.setActive(account);
    } catch (e) {
      if (e instanceof Error) toast({ status: "error", description: e.message });
    }
    setLoading(undefined);
  };

  return (
    <Flex as="form" direction="column" gap="2" onSubmit={handleSubmit} w="full">
      {loading && <Text fontSize="lg">{loading}</Text>}
      {!loading && (
        <FormControl>
          <FormLabel htmlFor="bunker">Remote Signer URL</FormLabel>
          <Flex gap="2">
            <Input
              id="bunker"
              name="bunker"
              placeholder="bunker://<pubkey>?relay=wss://relay.example.com"
              isRequired
              value={connection}
              onChange={(e) => setConnection(e.target.value)}
              autoComplete="off"
            />
            <QRCodeScannerButton onResult={(v) => setConnection(v)} />
          </Flex>
          <FormHelperText>Enter the bunker URI of the remote signer you want to connect to.</FormHelperText>
        </FormControl>
      )}
      <Flex justifyContent="space-between" gap="2" mt="4">
        <Button variant="link" onClick={() => navigate("../")} py="2">
          Back
        </Button>
        <Button colorScheme="primary" type="submit" isLoading={!!loading}>
          Connect
        </Button>
      </Flex>

      <Flex w="full" alignItems="center" gap="4">
        <Divider />
        <Text fontWeight="bold">OR</Text>
        <Divider />
      </Flex>
      <Button as={RouterLink} to="signer" variant="outline">
        Create Connection QR code
      </Button>
    </Flex>
  );
}
