import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  IconButton,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Spacer,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { getEncodedToken, normalizeProofAmounts, ProofState } from "@cashu/cashu-ts";
import { use$, useActiveAccount } from "applesauce-react/hooks";
import { WalletToken } from "applesauce-wallet/casts";
import { useMemo, useState } from "react";

import CashuMintFavicon from "../../../components/cashu/cashu-mint-favicon";
import CashuMintName from "../../../components/cashu/cashu-mint-name";
import { CopyIconButton } from "../../../components/copy-icon-button";
import DebugEventButton from "../../../components/debug-modal/debug-event-button";
import { ErrorBoundary } from "../../../components/error-boundary";
import { ECashIcon, QrCodeIcon, TrashIcon } from "../../../components/icons";
import Lock01 from "../../../components/icons/lock-01";
import QrCodeSvg from "../../../components/qr-code/qr-code-svg";
import Timestamp from "../../../components/timestamp";
import useAsyncAction from "../../../hooks/use-async-action";
import { useNutWallet } from "../../../hooks/use-wallets";
import { useDeleteEventContext } from "../../../providers/route/delete-event-provider";
import { getCashuWallet } from "../../../services/cashu-mints";
import ReceiveTokenModal from "../components/receive-token-modal";
import SendTokenModal from "../components/send-token-modal";

/** A simple modal showing a token as a QR code */
function TokenQrModal({ token, onClose }: { token: string; onClose: () => void }) {
  return (
    <Modal isOpen onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Cashu Token</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb="4">
          <QrCodeSvg content={token} w="full" aspectRatio={1} aria-label="Cashu token QR code" />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

/** A compact card for a single NIP-60 token event with its value, mint and actions */
function TokenCard({ token }: { token: WalletToken }) {
  const account = useActiveAccount()!;
  const qrModal = useDisclosure();
  const { deleteEvent } = useDeleteEventContext();

  // meta$ emits once the token content is decrypted, re-rendering the card
  const meta = use$(token.meta$);
  const unlocked = token.unlocked && !!meta;

  const encoded = useMemo(() => {
    if (!unlocked || !token.mint || !token.proofs) return undefined;
    return getEncodedToken({ mint: token.mint, proofs: normalizeProofAmounts(token.proofs), unit: "sat" });
  }, [unlocked, token.mint, token.proofs]);

  const unlock = useAsyncAction(async () => {
    await token.unlock(account);
  }, [token, account]);

  const [spentState, setSpentState] = useState<ProofState[]>();
  const check = useAsyncAction(async () => {
    if (!token.mint || !token.proofs) return;
    const cashuWallet = await getCashuWallet(token.mint);
    setSpentState(await cashuWallet.checkProofsStates(token.proofs));
  }, [token.mint, token.proofs]);

  const unspent = spentState?.filter((s) => s.state === "UNSPENT").length;

  return (
    <Card variant="outline">
      <CardHeader p="3" pb="0" display="flex" flexDirection="row" alignItems="center" gap="2">
        {unlocked ? <ECashIcon color="green.400" boxSize={6} /> : <Lock01 boxSize={6} color="GrayText" />}
        <Text fontSize="xl" fontWeight="bold">
          {unlocked ? (
            <>
              {token.amount}
              <Text as="span" fontSize="sm" fontWeight="normal" color="GrayText" ms="1">
                sats
              </Text>
            </>
          ) : (
            "Locked"
          )}
        </Text>
        <Spacer />
        <Timestamp timestamp={token.event.created_at} fontSize="sm" color="GrayText" />
      </CardHeader>
      <CardBody px="3" py="2" display="flex" alignItems="center" gap="2">
        {unlocked && token.mint ? (
          <>
            <CashuMintFavicon mint={token.mint} size="xs" />
            <CashuMintName mint={token.mint} fontSize="sm" isTruncated />
          </>
        ) : (
          <Button size="xs" variant="link" onClick={unlock.run} isLoading={unlock.loading}>
            Unlock
          </Button>
        )}
      </CardBody>
      <CardFooter px="3" pt="0" pb="2" display="flex" gap="2">
        <Button
          size="xs"
          variant="ghost"
          onClick={check.run}
          isLoading={check.loading}
          isDisabled={!unlocked}
          colorScheme={spentState === undefined ? undefined : unspent ? "green" : "red"}
        >
          {spentState === undefined ? "Check" : `${unspent ? "Unspent" : "Spent"} ${unspent}/${spentState.length}`}
        </Button>
        <ButtonGroup size="xs" variant="ghost" ms="auto">
          {encoded && (
            <>
              <CopyIconButton value={encoded} aria-label="Copy token" />
              <IconButton icon={<QrCodeIcon boxSize={4} />} aria-label="Show QR code" onClick={qrModal.onOpen} />
            </>
          )}
          <DebugEventButton event={token.event} />
          <IconButton
            icon={<TrashIcon boxSize={4} />}
            aria-label="Delete token"
            colorScheme="red"
            onClick={() => deleteEvent(token.event)}
          />
        </ButtonGroup>
      </CardFooter>

      {qrModal.isOpen && encoded && <TokenQrModal token={encoded} onClose={qrModal.onClose} />}
    </Card>
  );
}

export default function WalletTokensTab() {
  const wallet = useNutWallet();
  const tokens = use$(wallet?.tokens$);
  const unlocked = use$(wallet?.unlocked$);
  const sendModal = useDisclosure();
  const receiveModal = useDisclosure();

  const unlockAll = useAsyncAction(async () => {
    await wallet?.unlock();
  }, [wallet]);

  const hasLocked = tokens?.some((token) => !token.unlocked) ?? false;

  return (
    <Flex direction="column" gap="2" w="full">
      <ButtonGroup size="sm">
        <Button colorScheme="primary" variant="outline" onClick={sendModal.onOpen} isDisabled={!unlocked}>
          Send token
        </Button>
        <Button colorScheme="primary" variant="outline" onClick={receiveModal.onOpen} isDisabled={!unlocked}>
          Receive token
        </Button>
        <Spacer />
        {hasLocked && (
          <Button variant="link" onClick={unlockAll.run} isLoading={unlockAll.loading}>
            Unlock all
          </Button>
        )}
      </ButtonGroup>

      {tokens === undefined ? (
        <Text color="GrayText">Loading tokens…</Text>
      ) : tokens.length === 0 ? (
        <Text color="GrayText">No tokens yet — receive a cashu token or a lightning payment to get started.</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing="2">
          {tokens.map((token) => (
            <ErrorBoundary key={token.id} event={token.event}>
              <TokenCard token={token} />
            </ErrorBoundary>
          ))}
        </SimpleGrid>
      )}

      {sendModal.isOpen && <SendTokenModal isOpen onClose={sendModal.onClose} />}
      {receiveModal.isOpen && <ReceiveTokenModal isOpen onClose={receiveModal.onClose} />}
    </Flex>
  );
}
