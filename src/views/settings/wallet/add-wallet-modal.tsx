import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import { WalletConnect } from "applesauce-wallet-connect";
import { generateSecretKey } from "nostr-tools";
import { useCallback, useEffect, useMemo, useState } from "react";

import QrCodeSvg from "../../../components/qr-code/qr-code-svg";
import { RelayUrlInput } from "../../../components/relay-url-input";
import pool from "../../../services/pool";
import { addNwcWallet, WALLET_TYPE_LABELS } from "../../../services/wallets";

/**
 * NWC "wallet auth" connect flow (NIP-47): show a QR the user scans with their wallet. When the wallet
 * connects back over nostr, we hand the parent a full nostr+walletconnect:// string to persist.
 */
function NwcQrConnect({ onConnect }: { onConnect: (uri: string) => void }) {
  const [relay, setRelay] = useState("wss://relay.getalby.com/v1");
  const client = useMemo(() => new WalletConnect({ pool, relays: [relay], secret: generateSecretKey() }), [relay]);

  useEffect(() => {
    let connected = false;
    const controller = new AbortController();
    client
      .waitForService(controller.signal)
      .then(() => {
        connected = true;
        if (client.connectURI) onConnect(client.connectURI);
      })
      .catch(() => {});
    return () => {
      if (!connected) controller.abort();
    };
  }, [client]);

  const uri = useMemo(
    () => client.getAuthURI({ methods: ["get_balance", "get_info", "make_invoice", "pay_invoice"], name: "noStrudel" }),
    [client],
  );

  return (
    <Flex direction="column" gap="2" alignItems="center">
      <Link href={uri} bg="white" p="4" borderRadius="md">
        <QrCodeSvg content={uri} w="48" h="48" aria-label="Wallet auth QR code" />
      </Link>
      <RelayUrlInput value={relay} onChange={(e) => setRelay(e.target.value)} w="full" />
      <Button as={Link} href={uri} colorScheme="primary" w="full">
        Open in wallet
      </Button>
      <Text fontSize="sm" color="GrayText" textAlign="center">
        Scan with a NWC wallet (e.g. Alby) — it connects back automatically.
      </Text>
    </Flex>
  );
}

export default function AddWalletModal({ onClose, ...props }: Omit<ModalProps, "children">) {
  const toast = useToast();
  const [mode, setMode] = useState<"qr" | "paste">("qr");
  const [name, setName] = useState("");
  const [uri, setUri] = useState("");
  const [loading, setLoading] = useState(false);

  // Persist a connection string and close on success
  const connect = useCallback(
    async (connectUri: string) => {
      setLoading(true);
      try {
        await addNwcWallet({ name: name.trim() || WALLET_TYPE_LABELS.nwc, uri: connectUri });
        onClose();
      } catch (error) {
        if (error instanceof Error) toast({ description: error.message, status: "error" });
      } finally {
        setLoading(false);
      }
    },
    [name, onClose, toast],
  );

  const handleAdd = useCallback(() => {
    if (!uri.trim()) return toast({ description: "Paste a NWC connection string", status: "error" });
    connect(uri.trim());
  }, [uri, connect, toast]);

  return (
    <Modal onClose={onClose} size="lg" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Connect a wallet</ModalHeader>
        <ModalCloseButton />
        <ModalBody display="flex" flexDirection="column" gap="4">
          <FormControl>
            <FormLabel>Name</FormLabel>
            <Input
              placeholder={`Default: ${WALLET_TYPE_LABELS.nwc}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
            />
          </FormControl>

          <Tabs
            colorScheme="primary"
            isFitted
            index={mode === "qr" ? 0 : 1}
            onChange={(index) => setMode(index === 0 ? "qr" : "paste")}
          >
            <TabList>
              <Tab>Scan QR</Tab>
              <Tab>Paste string</Tab>
            </TabList>
            <TabPanels>
              <TabPanel px="0" pt="4">
                <NwcQrConnect onConnect={connect} />
              </TabPanel>
              <TabPanel px="0" pt="4">
                <Textarea
                  placeholder="nostr+walletconnect://..."
                  value={uri}
                  onChange={(e) => setUri(e.target.value)}
                  rows={3}
                  fontFamily="mono"
                  fontSize="sm"
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
        <ModalFooter gap="2">
          <Button onClick={onClose} variant="ghost" isDisabled={loading}>
            Cancel
          </Button>
          {/* The QR flow connects on its own, so the Add button is only for the paste flow */}
          {mode === "paste" && (
            <Button colorScheme="primary" onClick={handleAdd} isLoading={loading}>
              Add
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
