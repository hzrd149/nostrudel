import { Button, ButtonGroup, Card, CardBody, CardFooter, Flex, Text } from "@chakra-ui/react";
import { kinds, NostrEvent } from "nostr-tools";
import { WalletQuery } from "applesauce-wallet/queries";
import {
  getTokenDetails,
  isTokenDetailsLocked,
  unlockTokenDetails,
  unlockWallet,
  WALLET_KIND,
  WALLET_TOKEN_KIND,
} from "applesauce-wallet/helpers";

import { useActiveAccount, useEventStore, useStoreQuery } from "applesauce-react/hooks";
import useAsyncErrorHandler from "../../hooks/use-async-error-handler";
import { eventStore } from "../../services/event-store";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import SimpleView from "../../components/layout/presets/simple-view";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import useUserMailboxes from "../../hooks/use-user-mailboxes";
import { useReadRelays } from "../../hooks/use-client-relays";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import useEventIntersectionRef from "../../hooks/use-event-intersection-ref";
import useEventUpdate from "../../hooks/use-event-update";
import DebugEventButton from "../../components/debug-modal/debug-event-button";
import { ECashIcon } from "../../components/icons";
import WalletBalanceCard from "./balance-card";
import { useMemo } from "react";

function TokenEvent({ token }: { token: NostrEvent }) {
  const account = useActiveAccount();
  const eventStore = useEventStore();
  useEventUpdate(token.id);
  const ref = useEventIntersectionRef(token);

  const locked = isTokenDetailsLocked(token);
  const details = !locked ? getTokenDetails(token) : undefined;
  const amount = details?.proofs.reduce((t, p) => t + p.amount, 0);

  const unlock = useAsyncErrorHandler(async () => {
    if (!account) return;
    await unlockTokenDetails(token, account);
    eventStore.update(token);
  }, [token, account, eventStore]);

  return (
    <Card ref={ref} w="full">
      <CardBody p="2" alignItems="center" flexDirection="row" display="flex" gap="2">
        <ECashIcon color="green.400" boxSize={6} />
        {amount && <Text>{amount}</Text>}
        <ButtonGroup size="sm" ms="auto">
          {locked && (
            <Button onClick={unlock} variant="link" p="2">
              Unlock
            </Button>
          )}
          <DebugEventButton variant="ghost" event={token} />
        </ButtonGroup>
      </CardBody>
      {details && (
        <CardFooter px="2" pt="0" pb="0">
          <Text fontSize="sm" fontStyle="italic">
            {details.mint}
          </Text>
        </CardFooter>
      )}
    </Card>
  );
}

export default function WalletHomeView() {
  const account = useActiveAccount()!;
  const wallet = useReplaceableEvent({ kind: WALLET_KIND, pubkey: account.pubkey });

  const mailboxes = useUserMailboxes(account.pubkey);
  const readRelays = useReadRelays(mailboxes?.outboxes);
  const { timeline: events, loader } = useTimelineLoader(`${account.pubkey}-wallet-tokens`, readRelays, [
    {
      kinds: [WALLET_TOKEN_KIND],
      authors: [account.pubkey],
    },
    { kinds: [kinds.EventDeletion], "#k": [String(WALLET_TOKEN_KIND)], authors: [account.pubkey] },
  ]);

  const tokens = useMemo(() => events.filter((e) => e.kind === WALLET_TOKEN_KIND), [events]);

  const unlock = useAsyncErrorHandler(async () => {
    if (!wallet) throw new Error("Missing wallet");
    await unlockWallet(wallet, account);
    eventStore.update(wallet);

    // attempt to unlock all tokens
    for (const token of tokens) {
      await unlockTokenDetails(token, account);
      eventStore.update(token);
    }
  }, [wallet, account, tokens]);

  const walletInfo = useStoreQuery(WalletQuery, [account.pubkey]);

  const callback = useTimelineCurserIntersectionCallback(loader);

  return (
    <IntersectionObserverProvider callback={callback}>
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
        <WalletBalanceCard pubkey={account.pubkey} w="full" maxW="2xl" mx="auto" />
        {walletInfo?.locked === false && (
          <Card p="2" whiteSpace="pre-line">
            Key: {walletInfo.privateKey}
            <br />
            Mints: {walletInfo.mints.join(", ")}
          </Card>
        )}

        <Flex direction="column" gap="2" w="full" maxW="lg" mx="auto">
          {tokens.map((token) => (
            <TokenEvent key={token.id} token={token} />
          ))}
        </Flex>
      </SimpleView>
    </IntersectionObserverProvider>
  );
}
