import { Button, Divider, Flex, FormControl, FormHelperText, FormLabel, Input, Text } from "@chakra-ui/react";
import { NostrConnectAccount } from "applesauce-accounts/accounts";
import { useAccountManager } from "applesauce-react/hooks";
import { NostrConnectSigner } from "applesauce-signers/signers/nostr-connect-signer";
import { normalizeURL } from "applesauce-core/helpers";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { CopyIconButton } from "../../../components/copy-icon-button";
import QrCodeSvg from "../../../components/qr-code/qr-code-svg";
import QRCodeScannerButton from "../../../components/qr-code/qr-code-scanner-button";
import { RelayUrlInput } from "../../../components/relay-url-input";
import { DEFAULT_NOSTR_CONNECT_RELAY, NOSTR_CONNECT_PERMISSIONS } from "../../../const";
import useAsyncAction from "../../../hooks/use-async-action";

export default function SigninConnectView() {
  const navigate = useNavigate();
  const accounts = useAccountManager();
  const urlInputRef = useRef<HTMLInputElement | null>(null);

  // --- QR / waiting signer section ---
  const [relay, setRelay] = useState<string>(DEFAULT_NOSTR_CONNECT_RELAY);
  const [signer, setSigner] = useState<NostrConnectSigner>();

  // Re-create the signer when the relay changes
  useEffect(() => {
    const s = new NostrConnectSigner({ relays: [relay] });
    setSigner(s);

    s.waitForSigner().then(async () => {
      const pubkey = await s.getPublicKey();
      const account = new NostrConnectAccount(pubkey, s);
      accounts.addAccount(account);
      accounts.setActive(account);
    });

    return () => {
      if (!s.isConnected) s.close();
    };
  }, [relay, accounts]);

  const connectionURL = useMemo(() => {
    if (!signer) return "";
    return signer.getNostrConnectURI({
      name: "noStrudel",
      url: location.protocol + "//" + location.host,
      image: new URL("/apple-touch-icon.png", location.protocol + "//" + location.host).toString(),
    });
  }, [signer]);

  // --- Bunker URI paste section ---
  const [connection, setConnection] = useState("");

  const { loading, run: handleConnect } = useAsyncAction(async () => {
    const s = await NostrConnectSigner.fromBunkerURI(connection, {
      permissions: NOSTR_CONNECT_PERMISSIONS,
    });
    const pubkey = await s.getPublicKey();
    const account = new NostrConnectAccount(pubkey, s);
    accounts.addAccount(account);
    accounts.setActive(account);
  });

  return (
    <Flex direction="column" gap="4" w="full">
      {/* QR code */}
      <a href={connectionURL} target="_blank" rel="noreferrer">
        <QrCodeSvg content={connectionURL} />
      </a>
      <Flex gap="2">
        <Input
          value={connectionURL}
          ref={urlInputRef}
          onFocus={() => urlInputRef.current?.select()}
          onChange={() => {}}
          readOnly
        />
        <CopyIconButton value={connectionURL} aria-label="Copy connection URL" />
      </Flex>

      {/* Relay input with Set button */}
      <FormControl
        as="form"
        onSubmit={(e) => {
          e.preventDefault();
          const data = new FormData(e.target as HTMLFormElement);
          const value = normalizeURL(data.get("relay") as string);
          if (typeof value === "string") setRelay(value);
        }}
      >
        <FormLabel htmlFor="relay">Connection Relay</FormLabel>
        <Flex gap="2">
          <RelayUrlInput id="relay" name="relay" defaultValue={relay} />
          <Button type="submit" colorScheme="primary">
            Set
          </Button>
        </Flex>
      </FormControl>

      <Flex w="full" alignItems="center" gap="4" my="2">
        <Divider />
        <Text fontWeight="bold" whiteSpace="nowrap">
          Or paste bunker URI
        </Text>
        <Divider />
      </Flex>

      {/* Bunker URI paste */}
      <FormControl
        as="form"
        onSubmit={(e) => {
          e.preventDefault();
          handleConnect();
        }}
      >
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
        <Button mt="2" colorScheme="primary" type="submit" isLoading={loading} isDisabled={!connection}>
          Connect
        </Button>
      </FormControl>

      <Button variant="link" onClick={() => navigate("../")} py="2" alignSelf="flex-start" mt="2">
        Back
      </Button>
    </Flex>
  );
}
