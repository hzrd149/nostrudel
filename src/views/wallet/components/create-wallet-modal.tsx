import {
  Alert,
  AlertDescription,
  AlertIcon,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
} from "@chakra-ui/react";
import { generateSecretKey } from "nostr-tools";
import { useState } from "react";

import useAsyncAction from "../../../hooks/use-async-action";
import { useNutWallet } from "../../../hooks/use-wallets";

const DEFAULT_WALLET_RELAYS = [
  "wss://relay.damus.io",
  "wss://nos.lol",
  "wss://relay.snort.social",
  "wss://relay.nostr.band",
  "wss://relay.primal.net",
];

/** Creates a new NIP-60 wallet for the active account using the NutWallet class */
export default function CreateWalletModal({ onClose, ...props }: Omit<ModalProps, "children">) {
  const wallet = useNutWallet();
  const [mintInput, setMintInput] = useState("https://mint.minibits.cash/Bitcoin");
  const [mints, setMints] = useState<string[]>([]);
  const [receiveNutzaps, setReceiveNutzaps] = useState(false);

  const addMint = () => {
    const url = mintInput.trim();
    if (!url || mints.includes(url)) return;
    setMints((prev) => [...prev, url]);
    setMintInput("");
  };

  const removeMint = (url: string) => setMints((prev) => prev.filter((m) => m !== url));

  const { run: create, loading: creating } = useAsyncAction(async () => {
    if (!wallet) throw new Error("Sign in to create a Cashu wallet");
    const allMints = mints.length > 0 ? mints : [mintInput.trim()].filter(Boolean);
    if (allMints.length === 0) return;

    await wallet.createWallet({
      mints: allMints,
      privateKey: receiveNutzaps ? generateSecretKey() : undefined,
      relays: DEFAULT_WALLET_RELAYS,
    });
    onClose();
  }, [wallet, mints, mintInput, receiveNutzaps, onClose]);

  return (
    <Modal onClose={onClose} {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create Cashu Wallet</ModalHeader>
        <ModalCloseButton />
        <ModalBody display="flex" flexDirection="column" gap="4">
          <Alert status="warning" size="sm">
            <AlertIcon />
            <AlertDescription>Only add mints you trust. Do not put large amounts in any mint.</AlertDescription>
          </Alert>

          <FormControl>
            <FormLabel>Mint URL</FormLabel>
            <Flex gap="2">
              <Input
                value={mintInput}
                onChange={(e) => setMintInput(e.target.value)}
                placeholder="https://mint.example.com"
                onKeyDown={(e) => e.key === "Enter" && addMint()}
              />
              <Button onClick={addMint} flexShrink={0}>
                Add
              </Button>
            </Flex>
            <FormHelperText>Enter at least one Cashu mint URL</FormHelperText>
          </FormControl>

          {mints.length > 0 && (
            <Flex direction="column" gap="1">
              {mints.map((m) => (
                <Flex key={m} alignItems="center" gap="2" p="2" borderWidth="1px" borderRadius="md">
                  <Flex flex={1} fontSize="sm" fontFamily="mono" overflow="hidden" textOverflow="ellipsis">
                    {m}
                  </Flex>
                  <Button size="xs" colorScheme="red" variant="ghost" onClick={() => removeMint(m)}>
                    Remove
                  </Button>
                </Flex>
              ))}
            </Flex>
          )}

          <FormControl>
            <Checkbox isChecked={receiveNutzaps} onChange={(e) => setReceiveNutzaps(e.target.checked)}>
              Enable receiving nutzaps (NIP-61)
            </Checkbox>
            {receiveNutzaps && (
              <FormHelperText>A private key will be generated for P2PK-locked nutzap reception.</FormHelperText>
            )}
          </FormControl>
        </ModalBody>
        <ModalFooter gap="2">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            colorScheme="primary"
            onClick={create}
            isLoading={creating}
            isDisabled={mints.length === 0 && !mintInput.trim()}
          >
            Create Wallet
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
