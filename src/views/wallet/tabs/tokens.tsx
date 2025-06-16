import { useMemo, useState } from "react";
import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Flex,
  FlexProps,
  IconButton,
  Spacer,
  Text,
  useDisclosure,
} from "@chakra-ui/react";
import { useActiveAccount, useEventModel, useEventStore } from "applesauce-react/hooks";
import { WalletTokensModel } from "applesauce-wallet/models";
import { getTokenContent, isTokenContentLocked, unlockTokenContent } from "applesauce-wallet/helpers";
import { NostrEvent } from "nostr-tools";
import { getEncodedToken, ProofState } from "@cashu/cashu-ts";

import useAsyncAction from "../../../hooks/use-async-action";
import useEventUpdate from "../../../hooks/use-event-update";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import { ChevronDownIcon, ChevronUpIcon, ECashIcon, ExternalLinkIcon, TrashIcon } from "../../../components/icons";
import DebugEventButton from "../../../components/debug-modal/debug-event-button";
import { useDeleteEventContext } from "../../../providers/route/delete-event-provider";
import Timestamp from "../../../components/timestamp";
import { getCashuWallet } from "../../../services/cashu-mints";
import ConsolidateTokensButton from "../components/consolidate-tokens-button";
import CashuMintFavicon from "../../../components/cashu/cashu-mint-favicon";
import CashuMintName from "../../../components/cashu/cashu-mint-name";
import { CopyIconButton } from "../../../components/copy-icon-button";
import RouterLink from "../../../components/router-link";

function TokenEvent({ token }: { token: NostrEvent }) {
  const more = useDisclosure();
  const account = useActiveAccount();
  const eventStore = useEventStore();
  useEventUpdate(token.id);
  const ref = useEventIntersectionRef(token);

  const locked = isTokenContentLocked(token);
  const details = !locked ? getTokenContent(token) : undefined;
  const amount = details?.proofs.reduce((t, p) => t + p.amount, 0);

  const [spentState, setSpentState] = useState<ProofState[]>();
  const { run: check } = useAsyncAction(async () => {
    if (!details) return;
    const wallet = await getCashuWallet(details.mint);
    const state = await wallet.checkProofsStates(details.proofs);

    setSpentState(state);
  }, [details, setSpentState]);

  const { deleteEvent } = useDeleteEventContext();

  const { run: unlock } = useAsyncAction(async () => {
    if (!account) return;
    await unlockTokenContent(token, account);
    eventStore.update(token);
  }, [token, account, eventStore]);

  const encoded = useMemo(() => details && getEncodedToken(details), [details]);

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
        </ButtonGroup>
      </CardHeader>
      <CardBody display="flex" gap="2" px="2" pt="0" pb="2">
        {details && (
          <>
            <CashuMintFavicon mint={details.mint} size="xs" />
            <CashuMintName mint={details.mint} />
          </>
        )}
        <Spacer />
        <Button
          variant="link"
          onClick={more.onToggle}
          rightIcon={more.isOpen ? <ChevronUpIcon boxSize={6} /> : <ChevronDownIcon boxSize={6} />}
        >
          Details
        </Button>
      </CardBody>
      {more.isOpen && (
        <CardFooter px="2" pt="0" pb="2" gap="2" display="flex">
          <ButtonGroup size="sm">
            <Button
              variant="ghost"
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
          </ButtonGroup>
          <ButtonGroup ms="auto" size="sm">
            {encoded && (
              <>
                <CopyIconButton value={encoded} aria-label="Copy token" variant="ghost" />
                <IconButton
                  as={RouterLink}
                  to="/wallet/send/token"
                  state={{ token: encoded }}
                  icon={<ExternalLinkIcon />}
                  aria-label="Show token"
                  variant="ghost"
                />
              </>
            )}
            <DebugEventButton variant="ghost" event={token} />

            <IconButton
              aria-label="Delete entry"
              onClick={() => deleteEvent(token)}
              colorScheme="red"
              variant="ghost"
              icon={<TrashIcon />}
            />
          </ButtonGroup>
        </CardFooter>
      )}
    </Card>
  );
}

export default function WalletTokensTab({ ...props }: Omit<FlexProps, "children">) {
  const account = useActiveAccount()!;
  const eventStore = useEventStore();

  const tokens = useEventModel(WalletTokensModel, [account.pubkey]) ?? [];
  const locked = useEventModel(WalletTokensModel, [account.pubkey, true]) ?? [];

  const { run: unlock } = useAsyncAction(async () => {
    if (!locked) return;
    for (const token of locked) {
      await unlockTokenContent(token, account);
      eventStore.update(token);
    }
  }, [locked, account, eventStore]);

  return (
    <Flex direction="column" gap="2" {...props}>
      <ButtonGroup variant="link">
        <ConsolidateTokensButton />
        <Spacer />
        <Button onClick={unlock} isDisabled={!locked || locked.length === 0}>
          Unlock all ({locked?.length})
        </Button>
      </ButtonGroup>

      {tokens.map((token) => (
        <TokenEvent key={token.id} token={token} />
      ))}
    </Flex>
  );
}
