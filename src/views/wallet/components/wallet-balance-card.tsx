import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardProps,
  Editable,
  EditableInput,
  EditablePreview,
  Flex,
  IconButton,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { use$ } from "applesauce-react/hooks";

import { ECashIcon, LightningIcon } from "../../../components/icons";
import RefreshCcw01 from "../../../components/icons/refresh-ccw-01";
import useAsyncAction from "../../../hooks/use-async-action";
import { WALLET_TYPE_LABELS, type WalletBackend } from "../../../services/wallets";
import ReceiveLightningModal from "./receive-lightning-modal";
import SendLightningModal from "./send-lightning-modal";

/** Shows the active wallet's balance with lightning send / receive actions (works for every wallet type) */
export default function WalletBalanceCard({
  wallet,
  ...props
}: { wallet: WalletBackend } & Omit<CardProps, "children">) {
  const balance = use$(wallet.balance$);
  const sendModal = useDisclosure();
  const receiveModal = useDisclosure();

  const refresh = useAsyncAction(() => wallet.refresh(), [wallet]);
  const rename = useAsyncAction(async (name: string) => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== wallet.name) await wallet.rename?.(trimmed);
  }, [wallet]);

  return (
    <Card {...props}>
      <CardHeader
        display="flex"
        flexDirection="column"
        gap="2"
        justifyContent="center"
        alignItems="center"
        pt="8"
        pb="0"
        position="relative"
      >
        <Flex gap="4" alignItems="center">
          {wallet.type === "nutwallet" ? (
            <ECashIcon color="green.400" boxSize={12} />
          ) : (
            <LightningIcon color="yellow.400" boxSize={12} />
          )}
          <Text fontWeight="bold" fontSize="4xl">
            {balance === undefined ? "—" : balance.toLocaleString()}
            <Text as="span" fontSize="lg" fontWeight="normal" color="GrayText" ms="2">
              sats
            </Text>
          </Text>
        </Flex>
        <Flex direction="column" alignItems="center" gap="0">
          {wallet.rename ? (
            <Editable
              key={wallet.id}
              defaultValue={wallet.name}
              fontWeight="medium"
              textAlign="center"
              isDisabled={rename.loading}
              onSubmit={rename.run}
              submitOnBlur
            >
              <EditablePreview px="2" borderRadius="md" cursor="pointer" _hover={{ bg: "whiteAlpha.200" }} />
              <EditableInput px="2" />
            </Editable>
          ) : (
            <Text fontWeight="medium">{wallet.name}</Text>
          )}
          <Text color="GrayText" fontSize="sm">
            {WALLET_TYPE_LABELS[wallet.type]}
          </Text>
        </Flex>
        <IconButton
          icon={<RefreshCcw01 boxSize={5} />}
          aria-label="Refresh balance"
          variant="ghost"
          size="sm"
          position="absolute"
          top="2"
          right="2"
          isLoading={refresh.loading}
          onClick={refresh.run}
        />
      </CardHeader>
      <CardBody>
        <Flex gap="2" w="full">
          <Button w="full" size="lg" onClick={sendModal.onOpen}>
            Send
          </Button>
          <Button w="full" size="lg" onClick={receiveModal.onOpen}>
            Receive
          </Button>
        </Flex>
      </CardBody>

      {sendModal.isOpen && <SendLightningModal isOpen onClose={sendModal.onClose} wallet={wallet} />}
      {receiveModal.isOpen && <ReceiveLightningModal isOpen onClose={receiveModal.onClose} wallet={wallet} />}
    </Card>
  );
}
