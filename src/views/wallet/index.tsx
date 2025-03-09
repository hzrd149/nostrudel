import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  Heading,
  Spinner,
} from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { WalletQuery } from "applesauce-wallet/queries";
import { unlockWallet, WALLET_KIND } from "applesauce-wallet/helpers";

import { useActiveAccount, useStoreQuery } from "applesauce-react/hooks";
import useAsyncErrorHandler from "../../hooks/use-async-error-handler";
import DebugEventButton from "../../components/debug-modal/debug-event-button";
import { eventStore } from "../../services/event-store";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import SimpleView from "../../components/layout/presets/simple-view";

function Wallet({ wallet }: { wallet: NostrEvent }) {
  const account = useActiveAccount()!;

  const walletInfo = useStoreQuery(WalletQuery, [account.pubkey]);

  return (
    <Card>
      <CardHeader display="flex" gap="2" p="2" alignItems="center">
        <Heading size="md">Wallet</Heading>
        {walletInfo?.locked && <Badge colorScheme="orange">Locked</Badge>}
        {wallet && <DebugEventButton event={wallet} variant="ghost" ml="auto" size="sm" />}
      </CardHeader>
      {walletInfo?.locked === false && (
        <CardBody px="2" py="0" whiteSpace="pre-line">
          Key: {walletInfo.privateKey}
          Mints: {walletInfo.mints.join(", ")}
        </CardBody>
      )}
    </Card>
  );
}

export default function WalletHomeView() {
  const account = useActiveAccount()!;
  const wallet = useReplaceableEvent({ kind: WALLET_KIND, pubkey: account.pubkey });

  const unlock = useAsyncErrorHandler(async () => {
    if (!wallet) throw new Error("Missing wallet");
    await unlockWallet(wallet, account);
    eventStore.update(wallet);
  }, [wallet, account]);

  const walletInfo = useStoreQuery(WalletQuery, [account.pubkey]);

  return (
    <SimpleView
      title="Wallet"
      actions={
        walletInfo?.locked && (
          <Button onClick={unlock} colorScheme="primary" ms="auto" size="sm">
            Unlock
          </Button>
        )
      }
    >
      {walletInfo?.locked && (
        <Alert
          status="info"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="xs"
          maxW="2xl"
          mx="auto"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Wallet locked!
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            Your wallet is locked, you need to unlock it in order to use it
          </AlertDescription>
          <Button onClick={unlock} colorScheme="primary" mt="6">
            Unlock
          </Button>
        </Alert>
      )}
      {walletInfo?.locked === false && (
        <Card p="2" whiteSpace="pre-line">
          Key: {walletInfo.privateKey}
          <br />
          Mints: {walletInfo.mints.join(", ")}
        </Card>
      )}
    </SimpleView>
  );
}
