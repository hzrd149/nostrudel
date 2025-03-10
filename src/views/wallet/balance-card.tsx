import { Button, Card, CardBody, CardFooter, CardHeader, CardProps, Text } from "@chakra-ui/react";
import { useActiveAccount, useEventStore, useStoreQuery } from "applesauce-react/hooks";
import { WalletBalanceQuery } from "applesauce-wallet/queries";
import { ECashIcon } from "../../components/icons";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import { isWalletLocked, unlockWallet, WALLET_KIND } from "applesauce-wallet/helpers";
import useAsyncErrorHandler from "../../hooks/use-async-error-handler";
import useEventUpdate from "../../hooks/use-event-update";

export default function WalletBalanceCard({ pubkey, ...props }: { pubkey: string } & Omit<CardProps, "children">) {
  const account = useActiveAccount();
  const eventStore = useEventStore();
  const wallet = useReplaceableEvent({ kind: WALLET_KIND, pubkey });
  useEventUpdate(wallet?.id);

  const locked = !wallet || isWalletLocked(wallet);
  const balance = useStoreQuery(WalletBalanceQuery, [pubkey]);

  const unlock = useAsyncErrorHandler(async () => {
    if (!account) throw new Error("Missing account");
    if (!wallet) throw new Error("Missing wallet");
    await unlockWallet(wallet, account);
    eventStore.update(wallet);
  }, [wallet, account]);

  return (
    <Card {...props}>
      <CardHeader gap="2" display="flex" justifyContent="center" alignItems="center" pt="10">
        <ECashIcon color="green.400" boxSize={6} />
        <Text fontWeight="bold" fontSize="lg">
          {balance ? Object.values(balance).reduce((t, v) => t + v, 0) : "--Locked--"}
        </Text>
      </CardHeader>
      <CardBody></CardBody>
      {locked && (
        <CardFooter display="flex">
          <Button colorScheme="primary" onClick={unlock} mx="auto">
            Unlock
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
