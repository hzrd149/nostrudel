import { Box, CardProps, Flex, Heading, LinkBox, Text } from "@chakra-ui/react";
import { includeMailboxes, withImmediateValueOrDefault } from "applesauce-core";
import { groupPubkeysByRelay, selectOptimalRelays } from "applesauce-core/helpers";
import { useActiveAccount, useObservableEagerMemo } from "applesauce-react/hooks";
import { useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";

import { ignoreUnhealthyRelaysOnPointers } from "applesauce-relay";
import { map } from "rxjs";
import { ErrorBoundary } from "../../../components/error-boundary";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import SimpleView from "../../../components/layout/presets/simple-view";
import RelayFavicon from "../../../components/relay/relay-favicon";
import RelayName from "../../../components/relay/relay-name";
import UserAvatar from "../../../components/user/user-avatar";
import { useAppTitle } from "../../../hooks/use-app-title";
import { useRelayInfo } from "../../../hooks/use-relay-info";
import { eventStore } from "../../../services/event-store";
import { liveness } from "../../../services/pool";

function OutboxRelayRow({
  relay,
  pubkeys,
  totalUsers,
  ...props
}: { relay: string; pubkeys: string[]; totalUsers?: number } & Omit<CardProps, "children">) {
  const { info } = useRelayInfo(relay);

  return (
    <Flex as={LinkBox} gap="4" p="2" alignItems="center" borderBottomWidth={1} overflow="hidden" {...props}>
      <RelayFavicon relay={relay} />
      <Flex direction="column" gap="2" overflow="hidden">
        <Box overflow="hidden">
          <HoverLinkOverlay as={RouterLink} to={`/feeds/outboxes/${encodeURIComponent(relay)}`}>
            <RelayName relay={relay} fontWeight="bold" fontSize="lg" isTruncated />
          </HoverLinkOverlay>
          <Text noOfLines={2} fontSize="sm" color="GrayText">
            {info?.description}
          </Text>
        </Box>
        <Flex gap={1}>
          {pubkeys.length > 20 ? (
            <Text fontSize="sm">
              {pubkeys.length} users ({totalUsers ? Math.round((pubkeys.length / totalUsers) * 100) : 0}% of friends)
            </Text>
          ) : (
            <>
              {pubkeys.slice(0, 10).map((pubkey) => (
                <UserAvatar key={pubkey} pubkey={pubkey} size="xs" showNip05={false} />
              ))}
              {pubkeys.length > 10 && (
                <Text fontSize="sm" color="GrayText" alignSelf="center">
                  +{pubkeys.length - 10} more
                </Text>
              )}
            </>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
}

function FriendsOutboxes() {
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
        <Text color="GrayText">Sign in to see where your friends publish.</Text>
      </Box>
    );
  }

  return (
    <>
      <Box p="4">
        <Heading size="lg">Friends' Outboxes</Heading>
        <Text color="GrayText">See which relays your friends publish to.</Text>
      </Box>

      <Flex direction="column" borderTopWidth={1}>
        {relays.map(({ relay, pubkeys }) => (
          <ErrorBoundary key={relay}>
            <OutboxRelayRow relay={relay} pubkeys={pubkeys} totalUsers={totalContacts} />
          </ErrorBoundary>
        ))}
      </Flex>
    </>
  );
}

export default function OutboxesView() {
  useAppTitle(`Friends Outboxes`);
  const account = useActiveAccount();

  return (
    <SimpleView title="Friends outboxes" flush gap={0}>
      <FriendsOutboxes />
    </SimpleView>
  );
}
