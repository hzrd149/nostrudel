import {
  Button,
  Card,
  CardBody,
  Flex,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Text,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import { getEncodedToken, getTokenMetadata } from "@cashu/cashu-ts";
import { decodeTokenFromEmojiString } from "applesauce-wallet/helpers";
import { useMemo, useState } from "react";

import CashuMintFavicon from "../../../components/cashu/cashu-mint-favicon";
import CashuMintName from "../../../components/cashu/cashu-mint-name";
import Clipboard from "../../../components/icons/clipboard";
import QRCodeScannerButton from "../../../components/qr-code/qr-code-scanner-button";
import useAsyncAction from "../../../hooks/use-async-action";
import { useNutWallet } from "../../../hooks/use-wallets";

/** Tries to decode a pasted value as an emoji-encoded or plain cashu token */
function normalizeToken(value: string): string {
  const trimmed = value.trim();
  try {
    const token = decodeTokenFromEmojiString(trimmed);
    if (token) return getEncodedToken(token);
  } catch (error) {}
  return trimmed;
}

/** Receives a Cashu token (pasted or scanned) into the NIP-60 wallet */
export default function ReceiveTokenModal({ onClose, ...props }: Omit<ModalProps, "children">) {
  const wallet = useNutWallet();
  const toast = useToast();
  const [input, setInput] = useState("");

  // Decode the token to show an amount / mint preview before receiving
  const metadata = useMemo(() => {
    try {
      return getTokenMetadata(input.trim());
    } catch (error) {
      return undefined;
    }
  }, [input]);

  const receive = useAsyncAction(async () => {
    if (!wallet) throw new Error("No Cashu wallet is loaded");
    if (!metadata) throw new Error("Not a valid cashu token");

    await wallet.receiveToken(input.trim());
    toast({ description: "Token received", status: "success" });
    onClose();
  }, [wallet, input, metadata, toast, onClose]);

  return (
    <Modal onClose={onClose} size="lg" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Receive Cashu Token</ModalHeader>
        <ModalCloseButton />
        <ModalBody display="flex" flexDirection="column" gap="4">
          <Textarea
            value={input}
            onChange={(e) => setInput(normalizeToken(e.target.value))}
            placeholder="cashuB..."
            rows={6}
            fontFamily="mono"
            fontSize="xs"
            autoFocus
          />

          {metadata && (
            <Card variant="outline">
              <CardBody display="flex" flexDirection="column" gap="2" alignItems="center" p="4">
                <Text fontSize="3xl" fontWeight="bold">
                  {metadata.amount.toString()} {metadata.unit || "sats"}
                </Text>
                <Flex alignItems="center" gap="2">
                  <CashuMintFavicon mint={metadata.mint} size="xs" />
                  <CashuMintName mint={metadata.mint} fontSize="sm" />
                </Flex>
              </CardBody>
            </Card>
          )}

          <Flex gap="2">
            <IconButton
              icon={<Clipboard boxSize={5} />}
              aria-label="Paste"
              onClick={async () => setInput(normalizeToken(await navigator.clipboard.readText()))}
            />
            <QRCodeScannerButton onResult={(data) => setInput(normalizeToken(data))} />
          </Flex>
        </ModalBody>
        <ModalFooter gap="2">
          <Button variant="ghost" onClick={onClose} isDisabled={receive.loading}>
            Cancel
          </Button>
          <Button colorScheme="primary" onClick={receive.run} isLoading={receive.loading} isDisabled={!metadata}>
            Receive
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
