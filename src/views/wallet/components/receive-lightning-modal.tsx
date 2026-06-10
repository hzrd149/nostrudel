import {
  Alert,
  AlertIcon,
  Button,
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
  Spinner,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";

import { CopyButton } from "../../../components/copy-icon-button";
import QrCodeSvg from "../../../components/qr-code/qr-code-svg";
import useAsyncAction from "../../../hooks/use-async-action";
import { type WalletBackend } from "../../../services/wallets";

/** Creates a lightning invoice on any wallet backend and waits for it to be paid */
export default function ReceiveLightningModal({
  wallet,
  onClose,
  ...props
}: { wallet: WalletBackend } & Omit<ModalProps, "children">) {
  const [amount, setAmount] = useState("");
  const [invoice, setInvoice] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const create = useAsyncAction(async () => {
    const sats = parseInt(amount, 10);
    if (!sats || sats <= 0) throw new Error("Enter a valid amount");

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const result = await wallet.makeInvoice(sats, { description: "noStrudel", signal: controller.signal });
    setInvoice(result.invoice);
    // The backend's promise resolves when this specific invoice is paid; ignore it if superseded/closed
    result.paid.then(
      () => {
        if (!controller.signal.aborted) setPaid(true);
      },
      () => {}, // ignore aborts / wait failures
    );
  }, [amount, wallet]);

  const reset = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setInvoice(null);
    setAmount("");
    setPaid(false);
  };

  // Stop waiting for payment when the modal unmounts
  useEffect(() => () => abortRef.current?.abort(), []);

  return (
    <Modal onClose={onClose} size="lg" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Receive over Lightning</ModalHeader>
        <ModalCloseButton />
        <ModalBody display="flex" flexDirection="column" gap="4">
          {invoice && paid ? (
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              Invoice paid!
            </Alert>
          ) : invoice ? (
            <>
              <Flex justifyContent="center">
                <QrCodeSvg content={invoice} maxW="xs" w="full" aria-label="Lightning invoice QR code" />
              </Flex>
              <Textarea value={invoice} readOnly rows={4} fontFamily="mono" fontSize="xs" />
              <Flex alignItems="center" gap="2" color="GrayText">
                <Spinner size="sm" />
                <Text fontSize="sm">Waiting for payment…</Text>
              </Flex>
              <CopyButton value={invoice} colorScheme="primary">
                Copy invoice
              </CopyButton>
            </>
          ) : (
            <FormControl>
              <FormLabel>Amount (sats)</FormLabel>
              <Input
                type="number"
                min="1"
                placeholder="Amount in sats"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !create.loading && create.run()}
                autoFocus
              />
              <FormHelperText>Creates a lightning invoice on {wallet.name}</FormHelperText>
            </FormControl>
          )}
        </ModalBody>
        <ModalFooter gap="2">
          {invoice ? (
            <>
              <Button variant="ghost" onClick={reset}>
                New invoice
              </Button>
              <Button colorScheme={paid ? "primary" : undefined} onClick={onClose}>
                {paid ? "Done" : "Close"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="primary" onClick={create.run} isLoading={create.loading} isDisabled={!amount.trim()}>
                Create invoice
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
