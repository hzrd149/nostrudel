import { Button, ButtonGroup, Card, CardHeader, Flex, Spacer, Text } from "@chakra-ui/react";
import { useActionRunner, useActiveAccount, useEventModel } from "applesauce-react/hooks";
import { ReceiveNutzaps } from "applesauce-wallet/actions";
import {
  getNutzapAmount,
  getNutzapComment,
  getNutzapMint,
  isValidNutzap,
  NUTZAP_KIND
} from "applesauce-wallet/helpers";
import { ProfileNutZapzModel, ReceivedNutzapsModel } from "applesauce-wallet/models";
import { NostrEvent } from "nostr-tools";

import CashuMintName from "../../../components/cashu/cashu-mint-name";
import { ErrorBoundary } from "../../../components/error-boundary";
import { ECashIcon } from "../../../components/icons";
import Timestamp from "../../../components/timestamp";
import UserAvatarLink from "../../../components/user/user-avatar-link";
import UserLink from "../../../components/user/user-link";
import useAsyncAction from "../../../hooks/use-async-action";
import { useReadRelays } from "../../../hooks/use-client-relays";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import useUserMailboxes from "../../../hooks/use-user-mailboxes";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import couch from "../../../services/cashu-couch";

function NutzapEntry({
  nutzap,
  received,
  onReceive,
}: {
  nutzap: NostrEvent;
  received: boolean;
  onReceive: (nutzap: NostrEvent) => Promise<void>;
}) {
  const ref = useEventIntersectionRef(nutzap);
  const amount = isValidNutzap(nutzap) ? getNutzapAmount(nutzap) : undefined;
  const mint = getNutzapMint(nutzap);
  const comment = getNutzapComment(nutzap);

  const { run: receive, loading } = useAsyncAction(async () => {
    await onReceive(nutzap);
  }, [nutzap, onReceive]);

  return (
    <Card ref={ref}>
      <CardHeader p="2" display="flex" flexDirection="row" gap="2" alignItems="center">
        <ECashIcon boxSize={6} color="green.400" />
        <UserAvatarLink pubkey={nutzap.pubkey} size="xs" />
        <Flex direction="column" flex={1} overflow="hidden">
          <Flex gap="1" alignItems="center">
            <Text fontWeight="bold">
              <UserLink pubkey={nutzap.pubkey} />
            </Text>
            {amount !== undefined && (
              <Text color="green.500" fontWeight="semibold">
                ⚡ {amount} sats
              </Text>
            )}
            {mint && (
              <Text fontSize="xs" color="gray.500">
                via <CashuMintName mint={mint} />
              </Text>
            )}
          </Flex>
          {comment && (
            <Text fontSize="sm" color="gray.600" noOfLines={1}>
              {comment}
            </Text>
          )}
        </Flex>
        <Spacer />
        <ButtonGroup size="sm" alignItems="center">
          <Timestamp timestamp={nutzap.created_at} />
          {received ? (
            <Text fontSize="xs" color="green.500" fontWeight="semibold">
              ✓ Received
            </Text>
          ) : (
            <Button colorScheme="green" onClick={receive} isLoading={loading} size="sm">
              Receive
            </Button>
          )}
        </ButtonGroup>
      </CardHeader>
    </Card>
  );
}

export default function WalletNutzapsTab() {
  const account = useActiveAccount()!;
  const actions = useActionRunner();

  const receivedIds = useEventModel(ReceivedNutzapsModel, [account.pubkey]) ?? [];
  const nutzaps = useEventModel(ProfileNutZapzModel, [account.pubkey]) ?? [];

  const unclaimedNutzaps = nutzaps.filter((n) => !receivedIds.includes(n.id));

  const mailboxes = useUserMailboxes(account.pubkey);
  const relays = useReadRelays(mailboxes?.inboxes);
  const { loader } = useTimelineLoader(`${account.pubkey}-nutzaps`, relays, {
    kinds: [NUTZAP_KIND],
    "#p": [account.pubkey],
  });
  const callback = useTimelineCurserIntersectionCallback(loader);

  const handleReceive = async (nutzap: NostrEvent) => {
    await actions.run(ReceiveNutzaps, nutzap, couch);
  };

  const { run: receiveAll, loading: receivingAll } = useAsyncAction(async () => {
    if (unclaimedNutzaps.length === 0) return;
    await actions.run(ReceiveNutzaps, unclaimedNutzaps, couch);
  }, [actions, unclaimedNutzaps]);

  return (
    <IntersectionObserverProvider callback={callback}>
      <Flex direction="column" gap="2" w="full">
        <ButtonGroup variant="link">
          <Button
            onClick={receiveAll}
            isLoading={receivingAll}
            isDisabled={unclaimedNutzaps.length === 0}
            colorScheme="green"
          >
            Receive All ({unclaimedNutzaps.length})
          </Button>
        </ButtonGroup>

        {nutzaps.length === 0 && (
          <Text color="gray.500" textAlign="center" py="4">
            No incoming nutzaps found
          </Text>
        )}

        {nutzaps.map((nutzap) => (
          <ErrorBoundary key={nutzap.id} event={nutzap}>
            <NutzapEntry nutzap={nutzap} received={receivedIds.includes(nutzap.id)} onReceive={handleReceive} />
          </ErrorBoundary>
        ))}
      </Flex>
    </IntersectionObserverProvider>
  );
}
