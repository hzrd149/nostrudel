import { useState } from "react";
import {
  Button,
  ButtonGroup,
  Card,
  CardFooter,
  CardHeader,
  Flex,
  FlexProps,
  IconButton,
  Spacer,
  Text,
} from "@chakra-ui/react";
import { useActiveAccount, useEventStore, useStoreQuery } from "applesauce-react/hooks";
import { WalletTokensQuery } from "applesauce-wallet/queries";
import { getTokenDetails, isTokenDetailsLocked, unlockTokenDetails } from "applesauce-wallet/helpers";
import { NostrEvent } from "nostr-tools";
import { ProofState } from "@cashu/cashu-ts";

import useAsyncErrorHandler from "../../../hooks/use-async-error-handler";
import useEventUpdate from "../../../hooks/use-event-update";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import { ECashIcon, TrashIcon } from "../../../components/icons";
import DebugEventButton from "../../../components/debug-modal/debug-event-button";
import { useDeleteEventContext } from "../../../providers/route/delete-event-provider";
import Timestamp from "../../../components/timestamp";
import { getCashuWallet } from "../../../services/cashu-mints";

function TokenEvent({ token }: { token: NostrEvent }) {
  const account = useActiveAccount();
  const eventStore = useEventStore();
  useEventUpdate(token.id);
  const ref = useEventIntersectionRef(token);

  const locked = isTokenDetailsLocked(token);
  const details = !locked ? getTokenDetails(token) : undefined;
  const amount = details?.proofs.reduce((t, p) => t + p.amount, 0);

  const [spentState, setSpentState] = useState<ProofState[]>();
  const check = useAsyncErrorHandler(async () => {
    if (!details) return;
    const wallet = await getCashuWallet(details.mint);
    const state = await wallet.checkProofsStates(details.proofs);

    setSpentState(state);
  }, [details, setSpentState]);

  const { deleteEvent } = useDeleteEventContext();

  const unlock = useAsyncErrorHandler(async () => {
    if (!account) return;
    await unlockTokenDetails(token, account);
    eventStore.update(token);
  }, [token, account, eventStore]);

  return (
    <Card ref={ref} w="full">
      <CardHeader p="2" alignItems="center" flexDirection="row" display="flex" gap="2">
        <ECashIcon color="green.400" boxSize={8} />
        {amount && <Text fontSize="xl">{amount}</Text>}
        <ButtonGroup size="sm" ms="auto" alignItems="center">
          {locked && (
            <Button onClick={unlock} variant="link" p="2">
              Unlock
            </Button>
          )}
          <Timestamp timestamp={token.created_at} />
          <DebugEventButton variant="ghost" event={token} />
          <IconButton
            icon={<TrashIcon boxSize={5} />}
            aria-label="Delete entry"
            onClick={() => deleteEvent(token)}
            colorScheme="red"
            variant="ghost"
          />
        </ButtonGroup>
      </CardHeader>
      {details && (
        <CardFooter px="2" pt="0" pb="0" gap="2" display="flex">
          <Button
            variant="link"
            colorScheme={
              spentState === undefined ? undefined : spentState.some((s) => s.state === "UNSPENT") ? "green" : "red"
            }
            onClick={check}
          >
            {spentState === undefined
              ? "Check"
              : (spentState.some((s) => s.state === "UNSPENT") ? "Unspent" : "Spent") +
                ` ${spentState.filter((s) => s.state === "UNSPENT").length}/${spentState.length}`}
          </Button>
          <Spacer />
          <Text fontSize="sm" fontStyle="italic">
            {details.mint}
          </Text>
        </CardFooter>
      )}
    </Card>
  );
}

export default function WalletTokensTab({ ...props }: Omit<FlexProps, "children">) {
  const account = useActiveAccount()!;
  const eventStore = useEventStore();

  const tokens = useStoreQuery(WalletTokensQuery, [account.pubkey]) ?? [];
  const locked = useStoreQuery(WalletTokensQuery, [account.pubkey, true]) ?? [];

  const unlock = useAsyncErrorHandler(async () => {
    if (!locked) return;
    for (const token of locked) {
      await unlockTokenDetails(token, account);
      eventStore.update(token);
    }
  }, [locked, account, eventStore]);

  return (
    <Flex direction="column" gap="2" {...props}>
      {locked && locked.length > 0 && (
        <Button onClick={unlock} size="sm" variant="link" p="2" ms="auto">
          Unlock all ({locked?.length})
        </Button>
      )}

      {tokens.map((token) => (
        <TokenEvent key={token.id} token={token} />
      ))}
    </Flex>
  );
}
