import { Box, CardProps, Flex, Heading, SimpleGrid, Text } from "@chakra-ui/react";
import { includeMailboxes, withImmediateValueOrDefault } from "applesauce-core";
import { groupPubkeysByRelay, selectOptimalRelays } from "applesauce-core/helpers";
import { useActiveAccount, useObservableEagerMemo } from "applesauce-react/hooks";
import { ignoreUnhealthyRelaysOnPointers } from "applesauce-relay";
import { useMemo } from "react";
import { map } from "rxjs";

import { ErrorBoundary } from "../../../components/error-boundary";
import SimpleNavBox from "../../../components/layout/box-layout/simple-nav-box";
import SimpleView from "../../../components/layout/presets/simple-view";
import RelayFavicon from "../../../components/relay/relay-favicon";
import RelayName from "../../../components/relay/relay-name";
import { useAppTitle } from "../../../hooks/use-app-title";
import { useRelayInfo } from "../../../hooks/use-relay-info";
import { eventStore } from "../../../services/event-store";
import { liveness } from "../../../services/pool";

function OutboxRelayRow({ relay, pubkeys, totalUsers }: { relay: string; pubkeys: string[]; totalUsers?: number }) {
  const { info } = useRelayInfo(relay);

  return (
    <SimpleNavBox
      icon={<RelayFavicon relay={relay} />}
      title={<RelayName relay={relay} fontWeight="bold" fontSize="lg" isTruncated />}
      description={info?.description}
      metadata={
        <Text>
          {pubkeys.length} users ({totalUsers ? Math.round((pubkeys.length / totalUsers) * 100) : 0}% of contacts)
        </Text>
      }
      to={`/feeds/outboxes/${encodeURIComponent(relay)}`}
    />
  );
}

function ContactsOutboxes() {
  const account = useActiveAccount();

  const contacts = useObservableEagerMemo(
    () =>
      account &&
      eventStore.contacts({ pubkey: account.pubkey }).pipe(
        // Get users outboxes
        includeMailboxes(eventStore, "outbox"),
        // Ignore unhealthy relays
        ignoreUnhealthyRelaysOnPointers(liveness),
        // Limit the number of relays per user to 2 and only select 30 relays
        map((users) => users && selectOptimalRelays(users, { maxConnections: 50, maxRelaysPerUser: 200 })),
        // Fix for React
        withImmediateValueOrDefault(undefined),
      ),
    [account?.pubkey],
  );
  const outboxes = useMemo(() => contacts && groupPubkeysByRelay(contacts), [contacts]);

  // Calculate total contacts count
  const totalContacts = useMemo(() => contacts?.length || 0, [contacts]);

  // Calculate total contacts for each relay
  const relays = useMemo(() => {
    if (!outboxes) return [];

    return Object.entries(outboxes)
      .sort((a, b) => b[1].length - a[1].length)
      .map(([relay, users]) => ({ relay, pubkeys: users.map((u) => u.pubkey) }));
  }, [outboxes]);

  if (!account) {
    return (
      <Box p="4">
        <Heading size="lg">Outboxes</Heading>
        <Text color="GrayText">Sign in to see where your contacts publish.</Text>
      </Box>
    );
  }

  return (
    <>
      <Box p="4">
        <Heading size="lg">Contacts' Outboxes</Heading>
        <Text color="GrayText">See which relays your contacts publish to.</Text>
      </Box>

      <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} borderTopWidth={1}>
        {relays.map(({ relay, pubkeys }) => (
          <ErrorBoundary key={relay}>
            <OutboxRelayRow relay={relay} pubkeys={pubkeys} totalUsers={totalContacts} />
          </ErrorBoundary>
        ))}
      </SimpleGrid>
    </>
  );
}

export default function OutboxesView() {
  useAppTitle(`Contacts outboxes`);

  return (
    <SimpleView title="Contacts outboxes" flush gap={0}>
      <ContactsOutboxes />
    </SimpleView>
  );
}
