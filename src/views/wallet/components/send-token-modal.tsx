import {
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
  Select,
  Textarea,
} from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";
import { encodeTokenToEmoji } from "applesauce-wallet/helpers";
import { useMemo, useState } from "react";

import { CopyButton, CopyIconButton } from "../../../components/copy-icon-button";
import QrCodeSvg from "../../../components/qr-code/qr-code-svg";
import useAsyncAction from "../../../hooks/use-async-action";
import { useNutWallet } from "../../../hooks/use-wallets";

/** Creates a Cashu token from the NIP-60 wallet and displays it as text / QR */
export default function SendTokenModal({ onClose, ...props }: Omit<ModalProps, "children">) {
  const wallet = useNutWallet();
  const balance = use$(wallet?.balance$);
  const [amount, setAmount] = useState("");
  const [mint, setMint] = useState("");
  const [token, setToken] = useState<string | null>(null);

  // Only offer mints that actually hold a balance
  const mints = useMemo(() => (balance ? Object.keys(balance).filter((m) => (balance[m] || 0) > 0) : []), [balance]);

  const create = useAsyncAction(async () => {
    if (!wallet) throw new Error("No Cashu wallet is loaded");
    const sats = parseInt(amount, 10);
    if (!sats || sats <= 0) throw new Error("Enter a valid amount");

    setToken(await wallet.sendToken(sats, { mint: mint || undefined }));
  }, [wallet, amount, mint]);

  return (
    <Modal onClose={onClose} size="lg" {...props}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Send Cashu Token</ModalHeader>
        <ModalCloseButton />
        <ModalBody display="flex" flexDirection="column" gap="4">
          {token ? (
            <>
              <Flex justifyContent="center">
                <QrCodeSvg content={token} maxW="xs" w="full" aria-label="Cashu token QR code" />
              </Flex>
              <Textarea value={token} readOnly rows={5} fontFamily="mono" fontSize="xs" />
              <Flex gap="2">
                <CopyButton value={token} colorScheme="primary" flex={1}>
                  Copy token
                </CopyButton>
                <CopyIconButton
                  value={() => encodeTokenToEmoji(token)}
                  aria-label="Copy as emoji"
                  icon={<span>🥜</span>}
                />
              </Flex>
            </>
          ) : (
            <>
              <FormControl>
                <FormLabel>Amount (sats)</FormLabel>
                <Input
                  type="number"
                  min="1"
                  placeholder="Amount in sats"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                />
              </FormControl>
              {mints.length > 0 && (
                <FormControl>
                  <FormLabel>Mint</FormLabel>
                  <Select value={mint} onChange={(e) => setMint(e.target.value)}>
                    <option value="">Auto-select mint</option>
                    {mints.map((m) => (
                      <option key={m} value={m}>
                        {m} ({balance?.[m] || 0} sats)
                      </option>
                    ))}
                  </Select>
                  <FormHelperText>The mint the token will be created from</FormHelperText>
                </FormControl>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter gap="2">
          {token ? (
            <>
              <Button variant="ghost" onClick={() => setToken(null)}>
                Create another
              </Button>
              <Button colorScheme="primary" onClick={onClose}>
                Done
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={onClose} isDisabled={create.loading}>
                Cancel
              </Button>
              <Button colorScheme="primary" onClick={create.run} isLoading={create.loading} isDisabled={!amount.trim()}>
                Create token
              </Button>
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
