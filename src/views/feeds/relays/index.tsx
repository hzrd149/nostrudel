import { Box, CardProps, Flex, Heading, LinkBox, Text } from "@chakra-ui/react";
import { withImmediateValueOrDefault } from "applesauce-core";
import { FAVORITE_RELAYS_KIND, getRelaysFromList, groupPubkeysByRelay } from "applesauce-core/helpers";
import { TimelineModel } from "applesauce-core/models";
import {
  useActiveAccount,
  useEventModel,
  useObservableEagerMemo,
  useObservableEagerState,
} from "applesauce-react/hooks";
import { useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";
import { useMount } from "react-use";

import { ErrorBoundary } from "../../../components/error-boundary";
import HoverLinkOverlay from "../../../components/hover-link-overlay";
import SimpleView from "../../../components/layout/presets/simple-view";
import RelayFavicon from "../../../components/relay/relay-favicon";
import RelayName from "../../../components/relay/relay-name";
import UserAvatar from "../../../components/user/user-avatar";
import { SUPPORT_PUBKEY } from "../../../const";
import { useAppTitle } from "../../../hooks/use-app-title";
import useFavoriteRelays from "../../../hooks/use-favorite-relays";
import { useLoaderForOutboxes } from "../../../hooks/use-loaders-for-outboxes";
import { useRelayInfo } from "../../../hooks/use-relay-info";
import { outboxSelection } from "../../../models/outbox-selection";
import { eventStore } from "../../../services/event-store";
import { liveness } from "../../../services/pool";
import { RelayFavoriteIconButton } from "./components/relay-favorite-button";

function FavoriteRelayRow({ relay, ...props }: { relay: string } & Omit<CardProps, "children">) {
  const { info } = useRelayInfo(relay);

  return (
    <Flex borderBottomWidth={1} overflow="hidden" {...props}>
      <Flex as={LinkBox} gap="4" p="2" align="center" overflow="hidden" flex={1}>
        <RelayFavicon relay={relay} size="sm" />
        <HoverLinkOverlay as={RouterLink} to={`/feeds/relays/${encodeURIComponent(relay)}`}>
          <RelayName relay={relay} fontWeight="bold" fontSize="lg" isTruncated />
        </HoverLinkOverlay>
        <Text noOfLines={2} fontSize="sm" color="GrayText" isTruncated>
          {info?.description}
        </Text>
      </Flex>
      <RelayFavoriteIconButton relay={relay} size="lg" variant="ghost" colorScheme="yellow" h="full" aspectRatio={1} />
    </Flex>
  );
}

function RelayFeedRow({
  relay,
  pubkeys,
  showUsers = true,
  ...props
}: { relay: string; pubkeys: string[]; showUsers?: boolean } & Omit<CardProps, "children">) {
  const { info } = useRelayInfo(relay);

  return (
    <Flex as={LinkBox} gap="4" p="2" alignItems="center" borderBottomWidth={1} overflow="hidden" {...props}>
      <RelayFavicon relay={relay} />
      <Flex direction="column" gap="2" overflow="hidden">
        <Box overflow="hidden">
          <HoverLinkOverlay as={RouterLink} to={`/feeds/relays/${encodeURIComponent(relay)}`}>
            <RelayName relay={relay} fontWeight="bold" fontSize="lg" isTruncated />
          </HoverLinkOverlay>
          <Text noOfLines={2} fontSize="sm" color="GrayText">
            {info?.description}
          </Text>
        </Box>
        {showUsers && (
          <Flex gap={1}>
            {pubkeys.slice(0, 20).map((pubkey) => (
              <UserAvatar key={pubkey} pubkey={pubkey} size="xs" showNip05={false} />
            ))}
            {pubkeys.length > 20 && (
              <Text fontSize="sm" color="GrayText" alignSelf="center">
                +{pubkeys.length - 20} more
              </Text>
            )}
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}

function FavoriteRelays() {
  const account = useActiveAccount();
  const favorites = useFavoriteRelays(account?.pubkey);

  if (!favorites) return null;

  return (
    <>
      <Box p="4">
        <Heading size="lg">Favorites</Heading>
        <Text color="GrayText">Your favorite relays.</Text>
      </Box>

      <Flex direction="column" borderTopWidth={1}>
        {favorites.map((relay) => (
          <FavoriteRelayRow key={relay} relay={relay} />
        ))}
      </Flex>
    </>
  );
}

function DiscoverRelays({ pubkey, showUsers }: { pubkey: string; showUsers?: boolean }) {
  const userFavorites = useFavoriteRelays(pubkey);

  const selection = useObservableEagerMemo(
    () =>
      pubkey
        ? eventStore.contacts(pubkey).pipe(
            outboxSelection(),
            // TODO: I don't like this, why isn't the use observable hooks automatically handling sync values?
            withImmediateValueOrDefault(undefined),
          )
        : undefined,
    [pubkey],
  );
  const outboxes = useMemo(() => selection && groupPubkeysByRelay(selection), [selection]);

  const unhealthy = useObservableEagerState(liveness.unhealthy$);

  const loader = useLoaderForOutboxes("discover-favorite-relays", outboxes, [FAVORITE_RELAYS_KIND]);
  const favorites = useEventModel(
    TimelineModel,
    selection && [{ authors: selection.map((s) => s.pubkey), kinds: [FAVORITE_RELAYS_KIND] }],
  );

  // Load first page when component mounts
  useMount(() => loader().subscribe());

  // Calculate total favorites for each relay
  const relays = useMemo(() => {
    if (!favorites) return [];

    const totals = new Map<string, Set<string>>();
    for (const favorite of favorites) {
      const relays = getRelaysFromList(favorite);

      for (const relay of relays) {
        if (unhealthy.includes(relay)) continue;

        let set = totals.get(relay);
        if (!set) {
          set = new Set();
          totals.set(relay, set);
        }

        set.add(favorite.pubkey);
      }
    }
    return Array.from(totals.entries())
      .sort((a, b) => b[1].size - a[1].size)
      .map(([relay, set]) => ({ relay, pubkeys: Array.from(set) }));
  }, [favorites, unhealthy]);

  return (
    <>
      <Box p="4">
        <Heading size="lg">Discover</Heading>
        <Text color="GrayText">Discover relays your friends like.</Text>
      </Box>

      <Flex direction="column" borderTopWidth={1}>
        {relays
          .filter(({ relay }) => !userFavorites?.includes(relay))
          .map(({ relay, pubkeys }) => (
            <ErrorBoundary key={relay}>
              <RelayFeedRow relay={relay} pubkeys={pubkeys} showUsers={showUsers} />
            </ErrorBoundary>
          ))}
      </Flex>
    </>
  );
}

export default function RelaysView() {
  useAppTitle(`Relay feeds`);
  const account = useActiveAccount();

  return (
    <SimpleView title="Relay Feeds" flush gap={0}>
      {account && (
        <>
          <FavoriteRelays />
          <DiscoverRelays pubkey={account.pubkey} />
        </>
      )}
      {!account && <DiscoverRelays pubkey={SUPPORT_PUBKEY} showUsers={false} />}
    </SimpleView>
  );
}
