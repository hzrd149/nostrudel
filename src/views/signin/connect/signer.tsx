import { Button, Divider, Flex, FormControl, FormLabel, Input, Text } from "@chakra-ui/react";
import { NostrConnectAccount } from "applesauce-accounts/accounts";
import { useAccountManager } from "applesauce-react/hooks";
import { NostrConnectSigner } from "applesauce-signers/signers/nostr-connect-signer";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { CopyIconButton } from "../../../components/copy-icon-button";
import QrCodeSvg from "../../../components/qr-code/qr-code-svg";
import { RelayUrlInput } from "../../../components/relay-url-input";
import { DEFAULT_NOSTR_CONNECT_RELAY } from "../../../const";
import { normalizeURL } from "applesauce-core/helpers";

export default function SigninConnectSignerView() {
  const navigate = useNavigate();
  const urlInputRef = useRef<HTMLInputElement | null>(null);
  const [relay, setRelay] = useState<string>(DEFAULT_NOSTR_CONNECT_RELAY);
  const [signer, setSigner] = useState<NostrConnectSigner>();
  const accounts = useAccountManager();

  // Re-create the signer when the relay changes
  useEffect(() => {
    const s = new NostrConnectSigner({ relays: [relay] });
    setSigner(s);

    // Start listening for the signer to connect
    s.waitForSigner().then(async () => {
      const pubkey = await s.getPublicKey();

      const account = new NostrConnectAccount(pubkey, s);
      accounts.addAccount(account);
      accounts.setActive(account);
    });

    return () => {
      // Close the signer if its not connected
      if (!s.isConnected) s.close();
    };
  }, [relay, accounts]);

  // Get connection URI for signer
  const connectionURL = useMemo(() => {
    if (!signer) return "";

    return signer.getNostrConnectURI({
      name: "noStrudel",
      url: location.protocol + "//" + location.host,
      image: new URL("/apple-touch-icon.png", location.protocol + "//" + location.host).toString(),
    });
  }, [signer]);

  return (
    <Flex direction="column" gap="2" w="full">
      <a href={connectionURL} target="_blank" rel="noreferrer">
        <QrCodeSvg content={connectionURL} />
      </a>
      <Flex gap="2">
        <Input
          value={connectionURL}
          ref={urlInputRef}
          onFocus={() => urlInputRef.current?.select()}
          onChange={() => {}}
        />
        <CopyIconButton value={connectionURL} aria-label="Copy connection URL" />
      </Flex>
      <Flex gap="4" alignItems="center" my="2">
        <Divider />
        <Text fontWeight="bold">Options</Text>
        <Divider />
      </Flex>

      <FormControl
        as="form"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.target as HTMLFormElement);
          const relay = normalizeURL(data.get("relay") as string);
          if (typeof relay === "string") setRelay(relay);
        }}
      >
        <FormLabel htmlFor="input">Connection Relay</FormLabel>
        <Flex gap="2">
          <RelayUrlInput name="relay" defaultValue={relay} />
          <Button type="submit" colorScheme="primary">
            Set
          </Button>
        </Flex>
      </FormControl>
      <Flex justifyContent="space-between" gap="2" mt="4">
        <Button variant="link" onClick={() => navigate("../")} py="2">
          Back
        </Button>
      </Flex>
    </Flex>
  );
}
