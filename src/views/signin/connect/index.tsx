import { Button, Divider, Flex, FormControl, FormLabel, IconButton, Input, Spinner, Text } from "@chakra-ui/react";
import { NostrConnectAccount } from "applesauce-accounts/accounts";
import { normalizeURL } from "applesauce-core/helpers";
import { useAccountManager } from "applesauce-react/hooks";
import { NostrConnectSigner } from "applesauce-signers/signers/nostr-connect-signer";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { CopyIconButton } from "../../../components/copy-icon-button";
import Clipboard from "../../../components/icons/clipboard";
import QRCodeScannerButton from "../../../components/qr-code/qr-code-scanner-button";
import QrCodeSvg from "../../../components/qr-code/qr-code-svg";
import { RelayUrlInput } from "../../../components/relay-url-input";
import RelayStatusBadge from "../../../components/relays/relay-status";
import { DEFAULT_NOSTR_CONNECT_RELAY, NOSTR_CONNECT_PERMISSIONS } from "../../../const";
import useAsyncAction from "../../../hooks/use-async-action";

type NostrConnectAwaitPubkeyProps = {
  signer: NostrConnectSigner;
  onCancel: () => void;
  onComplete: () => void;
};

function NostrConnectAwaitPubkey({ signer, onCancel, onComplete }: NostrConnectAwaitPubkeyProps) {
  const accounts = useAccountManager();
  const [attempt, setAttempt] = useState(0);
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setShowRetry(false);
    const slowTimer = window.setTimeout(() => {
      if (!cancelled) setShowRetry(true);
    }, 5000);

    (async () => {
      try {
        const pubkey = await signer.getPublicKey();
        if (cancelled) return;
        const account = new NostrConnectAccount(pubkey, signer);
        accounts.addAccount(account);
        accounts.setActive(account);
        onComplete();
      } finally {
        clearTimeout(slowTimer);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(slowTimer);
    };
  }, [signer, attempt, accounts, onComplete]);

  const handleCancel = () => {
    signer.close();
    onCancel();
  };

  return (
    <Flex direction="column" align="center" justify="center" gap="6" py="20" w="full" minH="50vh" aria-live="polite">
      <Spinner size="xl" color="primary.500" thickness="4px" />
      <Text color="chakra-subtle-text">Getting your public key…</Text>
      <Flex gap="2">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        {showRetry ? (
          <Button colorScheme="primary" onClick={() => setAttempt((n) => n + 1)}>
            Retry
          </Button>
        ) : null}
      </Flex>
    </Flex>
  );
}

export default function SigninConnectView() {
  const navigate = useNavigate();
  const accounts = useAccountManager();
  const urlInputRef = useRef<HTMLInputElement | null>(null);

  // --- QR / waiting signer section ---
  const [relay, setRelay] = useState<string>(DEFAULT_NOSTR_CONNECT_RELAY);
  const [signer, setSigner] = useState<NostrConnectSigner>();
  const [connectEpoch, setConnectEpoch] = useState(0);
  const [awaitingPubkeySigner, setAwaitingPubkeySigner] = useState<NostrConnectSigner | null>(null);

  const handleAwaitPubkeyComplete = useCallback(() => {
    setAwaitingPubkeySigner(null);
  }, []);

  const handleCancelAwaitingPubkey = useCallback(() => {
    setConnectEpoch((n) => n + 1);
  }, []);

  // Re-create the signer when the relay changes
  useEffect(() => {
    let cancelled = false;
    const s = new NostrConnectSigner({ relays: [relay] });
    setSigner(s);
    setAwaitingPubkeySigner(null);

    s.waitForSigner().then(() => {
      if (cancelled) return;
      setAwaitingPubkeySigner(s);
    });

    return () => {
      cancelled = true;
      setAwaitingPubkeySigner(null);
      if (!s.isConnected) s.close();
    };
  }, [relay, connectEpoch]);

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

  if (awaitingPubkeySigner) {
    return (
      <NostrConnectAwaitPubkey
        signer={awaitingPubkeySigner}
        onCancel={handleCancelAwaitingPubkey}
        onComplete={handleAwaitPubkeyComplete}
      />
    );
  }

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
        <FormLabel htmlFor="relay">
          Connection Relay <RelayStatusBadge relay={relay} />
        </FormLabel>
        <Flex gap="2">
          <RelayUrlInput id="relay" name="relay" defaultValue={relay} />
          <Button type="submit">Set</Button>
        </Flex>
      </FormControl>

      <Button as="a" href={connectionURL} target="_blank" rel="noreferrer" colorScheme="primary">
        Open signer
      </Button>

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
          {"clipboard" in navigator ? (
            <IconButton
              icon={<Clipboard boxSize={5} />}
              aria-label="Paste from clipboard"
              onClick={async () => setConnection(await navigator.clipboard.readText())}
            />
          ) : null}
          <QRCodeScannerButton onResult={(v) => setConnection(v)} />
          <Input
            id="bunker"
            name="bunker"
            placeholder="bunker://<pubkey>?relay=wss://relay.example.com"
            isRequired
            value={connection}
            onChange={(e) => setConnection(e.target.value)}
            autoComplete="off"
          />
          <Button flexShrink="0" colorScheme="primary" type="submit" isLoading={loading} isDisabled={!connection}>
            Connect
          </Button>
        </Flex>
      </FormControl>

      <Button variant="link" onClick={() => navigate("../")} py="2" alignSelf="flex-start" mt="2">
        Back
      </Button>
    </Flex>
  );
}
