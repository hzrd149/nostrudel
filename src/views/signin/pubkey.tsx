import { useState } from "react";
import { Button, Flex, FormControl, FormHelperText, FormLabel, Input, Link, useToast } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

import { normalizeToHexPubkey } from "../../helpers/nip19";
import accountService from "../../services/account";
import QRCodeScannerButton from "../../components/qr-code/qr-code-scanner-button";
import PubkeyAccount from "../../classes/accounts/pubkey-account";

export default function LoginNpubView() {
  const navigate = useNavigate();
  const toast = useToast();
  const [npub, setNpub] = useState("");
  // const [relayUrl, setRelayUrl] = useState(COMMON_CONTACT_RELAY);

  const handleSubmit: React.FormEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();

    const pubkey = normalizeToHexPubkey(npub);
    if (!pubkey) return toast({ status: "error", title: "Invalid npub" });

    accountService.addAccount(new PubkeyAccount(pubkey));
    accountService.switchAccount(pubkey);
  };

  return (
    <Flex as="form" direction="column" gap="4" onSubmit={handleSubmit} w="full">
      <FormControl>
        <FormLabel>Enter user npub</FormLabel>
        <Flex gap="2">
          <Input type="text" placeholder="npub1" isRequired value={npub} onChange={(e) => setNpub(e.target.value)} />
          <QRCodeScannerButton onData={(v) => setNpub(v)} />
        </Flex>
        <FormHelperText>
          Enter any npub you want.{" "}
          <Link isExternal href="https://nostr.directory" color="blue.500" target="_blank">
            nostr.directory
          </Link>
        </FormHelperText>
      </FormControl>
      {/* <FormControl>
        <FormLabel>Bootstrap relay</FormLabel>
        <RelayUrlInput
          placeholder="wss://nostr.example.com"
          isRequired
          value={relayUrl}
          onChange={(e) => setRelayUrl(e.target.value)}
        />
        <FormHelperText>The first relay to connect to.</FormHelperText>
      </FormControl> */}
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
