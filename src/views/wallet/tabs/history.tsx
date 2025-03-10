import {
  AvatarGroup,
  Button,
  ButtonGroup,
  Card,
  CardBody,
  CardFooter,
  Flex,
  IconButton,
  Spacer,
  Text,
} from "@chakra-ui/react";
import { useActiveAccount, useEventStore, useStoreQuery } from "applesauce-react/hooks";
import {
  getHistoryDetails,
  getHistoryRedeemed,
  isHistoryDetailsLocked,
  unlockHistoryDetails,
} from "applesauce-wallet/helpers";
import { WalletHistoryQuery } from "applesauce-wallet/queries";
import { NostrEvent } from "nostr-tools";

import Lock01 from "../../../components/icons/lock-01";
import DebugEventButton from "../../../components/debug-modal/debug-event-button";
import ArrowBlockUp from "../../../components/icons/arrow-block-up";
import ArrowBlockDown from "../../../components/icons/arrow-block-down";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import useAsyncErrorHandler from "../../../hooks/use-async-error-handler";
import { useDeleteEventContext } from "../../../providers/route/delete-event-provider";
import { TrashIcon } from "../../../components/icons";
import useEventUpdate from "../../../hooks/use-event-update";
import Timestamp from "../../../components/timestamp";
import useSingleEvents from "../../../hooks/use-single-events";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import CashuMintFavicon from "../../../components/cashu/cashu-mint-favicon";
import CashuMintName from "../../../components/cashu/cashu-mint-name";

function HistoryEntry({ entry }: { entry: NostrEvent }) {
  const account = useActiveAccount()!;
  const eventStore = useEventStore();
  const locked = isHistoryDetailsLocked(entry);
  const details = !locked ? getHistoryDetails(entry) : undefined;
  useEventUpdate(entry.id);

  const ref = useEventIntersectionRef(entry);
  const { deleteEvent } = useDeleteEventContext();

  const redeemedIds = getHistoryRedeemed(entry);
  const redeemed = useSingleEvents(redeemedIds);

  const unlock = useAsyncErrorHandler(async () => {
    await unlockHistoryDetails(entry, account);
    eventStore.update(entry);
  }, [entry, account, eventStore]);

  return (
    <Card ref={ref}>
      <CardBody p="2" display="flex" flexDirection="row" gap="2">
        {locked ? (
          <Lock01 boxSize={8} />
        ) : details?.direction === "in" ? (
          <ArrowBlockDown boxSize={8} color="green.500" />
        ) : (
          <ArrowBlockUp boxSize={8} color="orange.500" />
        )}
        <Text fontSize="xl">{details?.amount}</Text>
        <Spacer />
        <ButtonGroup size="sm" alignItems="center">
          {locked && (
            <Button onClick={unlock} variant="link" p="2">
              Unlock
            </Button>
          )}
          <Timestamp timestamp={entry.created_at} />
          <DebugEventButton variant="ghost" event={entry} />
          <IconButton
            icon={<TrashIcon boxSize={5} />}
            aria-label="Delete entry"
            onClick={() => deleteEvent(entry)}
            colorScheme="red"
            variant="ghost"
          />
        </ButtonGroup>
      </CardBody>
      {details && (
        <CardFooter px="2" pt="0" pb="2">
          {details.mint && (
            <>
              <CashuMintFavicon mint={details.mint} size="xs" mr="2" />
              <CashuMintName mint={details.mint} />
            </>
          )}
          {redeemed.length > 0 && (
            <>
              <Text mr="2">Redeemed zaps from:</Text>
              <AvatarGroup size="sm">
                {redeemed.map((event) => (
                  <UserAvatarLink pubkey={event.pubkey} />
                ))}
              </AvatarGroup>
            </>
          )}
          {details.fee !== undefined && (
            <Text fontStyle="italic" ms="auto">
              fee: {details.fee}
            </Text>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

export default function WalletHistoryTab() {
  const account = useActiveAccount()!;
  const eventStore = useEventStore();

  const history = useStoreQuery(WalletHistoryQuery, [account.pubkey]) ?? [];
  const locked = useStoreQuery(WalletHistoryQuery, [account.pubkey, true]) ?? [];

  const unlock = useAsyncErrorHandler(async () => {
    for (const entry of locked) {
      if (!isHistoryDetailsLocked(entry)) continue;
      await unlockHistoryDetails(entry, account);
      eventStore.update(entry);
    }
  }, [locked, account, eventStore]);

  return (
    <Flex direction="column" gap="2" w="full">
      {locked && locked.length > 0 && (
        <Button onClick={unlock} size="sm" variant="link" p="2" ms="auto">
          Unlock all ({locked?.length})
        </Button>
      )}
      {history?.map((entry) => <HistoryEntry key={entry.id} entry={entry} />)}
    </Flex>
  );
}
