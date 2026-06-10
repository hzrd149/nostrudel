import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
  Textarea,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";

import Clipboard from "../../../components/icons/clipboard";
import QRCodeScannerButton from "../../../components/qr-code/qr-code-scanner-button";
import useAsyncAction from "../../../hooks/use-async-action";
import { resolveInvoice, type WalletBackend } from "../../../services/wallets";

/** Strips a lightning: prefix from scanned / pasted values */
function normalizeInput(value: string) {
  return value.trim().replace(/^lightning:/i, "");
}

/** Pays a bolt11 invoice or lightning address from any wallet backend */
export default function SendLightningModal({
  wallet,
  onClose,
  ...props
}: { wallet: WalletBackend } & Omit<ModalProps, "children">) {
  const toast = useToast();
  const [input, setInput] = useState("");
  const [amount, setAmount] = useState("");

  const trimmed = normalizeInput(input);
  // Anything that is not a bolt11 invoice is treated as a lightning address / LNURL and needs an amount
  const isAddress = trimmed.length > 0 && !/^ln(bc|tb|bcrt)/i.test(trimmed);

  const send = useAsyncAction(async () => {
    if (!trimmed) throw new Error("Paste an invoice or lightning address");
    const sats = amount ? parseInt(amount, 10) : undefined;
    const invoice = await resolveInvoice(trimmed, sats);
    await wallet.payInvoice(invoice);
    toast({ description: "Payment sent", status: "success" });
    onClose();
  }, [trimmed, amount, wallet, toast, onClose]);

  return (
    <Modal onClose={onClose} size="lg" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Send over Lightning</ModalHeader>
        <ModalCloseButton />
        <ModalBody display="flex" flexDirection="column" gap="4">
          <FormControl>
            <FormLabel>Invoice or lightning address</FormLabel>
            <Textarea
              placeholder="Lightning invoice (lnbc...) or address (name@domain.com)"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={4}
              fontFamily="mono"
              fontSize="sm"
              autoFocus
            />
            <FormHelperText>Pays from {wallet.name}</FormHelperText>
          </FormControl>

          {isAddress && (
            <FormControl>
              <FormLabel>Amount (sats)</FormLabel>
              <Input
                type="number"
                min="1"
                placeholder="Amount in sats"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </FormControl>
          )}

          <Flex gap="2">
            <IconButton
              icon={<Clipboard boxSize={5} />}
              aria-label="Paste"
              onClick={async () => setInput(normalizeInput(await navigator.clipboard.readText()))}
            />
            <QRCodeScannerButton onResult={(data) => setInput(normalizeInput(data))} />
          </Flex>
        </ModalBody>
        <ModalFooter gap="2">
          <Button variant="ghost" onClick={onClose} isDisabled={send.loading}>
            Cancel
          </Button>
          <Button colorScheme="primary" onClick={send.run} isLoading={send.loading} isDisabled={!trimmed}>
            Send payment
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
