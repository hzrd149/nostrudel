import { Box, Heading, SimpleGrid, Text } from "@chakra-ui/react";
import { FAVORITE_RELAYS_KIND, getRelaysFromList, kinds } from "applesauce-core/helpers";
import { TimelineModel } from "applesauce-core/models";
import { LoadableAddressPointer } from "applesauce-loaders/loaders";
import { useActiveAccount, useEventModel, useObservableEagerState } from "applesauce-react/hooks";
import { useMemo } from "react";
import { useMount } from "react-use";

import { ErrorBoundary } from "../../../components/error-boundary";
import SimpleNavBox from "../../../components/layout/box-layout/simple-nav-box";
import SimpleView from "../../../components/layout/presets/simple-view";
import RelayFavicon from "../../../components/relay/relay-favicon";
import RelayName from "../../../components/relay/relay-name";
import { SUPPORT_PUBKEY } from "../../../const";
import { useAppTitle } from "../../../hooks/use-app-title";
import useFavoriteRelays from "../../../hooks/use-favorite-relays";
import { useOutboxTimelineLoader } from "../../../hooks/use-outbox-timeline-loader";
import { useRelayInfo } from "../../../hooks/use-relay-info";
import useUserContacts from "../../../hooks/use-user-contacts";
import { liveness } from "../../../services/pool";
import { RelayFavoriteIconButton } from "./components/relay-favorite-button";

function FavoriteRelayRow({ relay }: { relay: string }) {
  const { info } = useRelayInfo(relay);

  return (
    <SimpleNavBox
      icon={<RelayFavicon relay={relay} size="sm" />}
      title={<RelayName relay={relay} fontWeight="bold" fontSize="lg" isTruncated />}
      description={info?.description}
      to={`/feeds/relays/${encodeURIComponent(relay)}`}
      actions={
        <RelayFavoriteIconButton
          relay={relay}
          size="lg"
          variant="ghost"
          colorScheme="yellow"
          h="full"
          aspectRatio={1}
        />
      }
    />
  );
}

function RelayFeedRow({ relay, pubkeys }: { relay: string; pubkeys: string[] }) {
  const { info } = useRelayInfo(relay);
  const account = useActiveAccount();
  const contacts = useUserContacts(account?.pubkey);
  const percentage = useMemo(
    () => (contacts?.length ? Math.round((pubkeys.length / contacts.length) * 100) : 0),
    [contacts, pubkeys.length],
  );

  return (
    <SimpleNavBox
      icon={<RelayFavicon relay={relay} />}
      title={<RelayName relay={relay} fontWeight="bold" fontSize="lg" isTruncated />}
      description={info?.description}
      footer={
        <Text fontSize="sm" color="GrayText">
          {pubkeys.length} users ({percentage}%)
        </Text>
      }
      to={`/feeds/relays/${encodeURIComponent(relay)}`}
    />
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

      <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} borderTopWidth={1}>
        {favorites.map((relay) => (
          <FavoriteRelayRow key={relay} relay={relay} />
        ))}
      </SimpleGrid>
    </>
  );
}

function DiscoverRelays({ pubkey, showUsers }: { pubkey: string; showUsers?: boolean }) {
  const userFavorites = useFavoriteRelays(pubkey);

  // Create list pointer and filter for loader
  const pointer = useMemo(() => ({ kind: kinds.Contacts, pubkey }) satisfies LoadableAddressPointer, [pubkey]);
  const filter = useMemo(() => ({ kinds: [FAVORITE_RELAYS_KIND] }), [pubkey]);

  // Create a timeline loader for the contacts favorite relays
  const loader = useOutboxTimelineLoader(pointer, filter && { ...filter, kinds: [FAVORITE_RELAYS_KIND] });

  // Load first page when component mounts
  useMount(() => loader?.().subscribe());

  // get contacts for timelien
  const contacts = useUserContacts(pubkey);
  const favorites = useEventModel(
    TimelineModel,
    contacts && [{ authors: contacts.map((s) => s.pubkey), kinds: [FAVORITE_RELAYS_KIND] }],
  );

  const unhealthy = useObservableEagerState(liveness.unhealthy$);

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

      <SimpleGrid columns={{ base: 1, lg: 2, xl: 3 }} borderTopWidth={1}>
        {relays
          .filter(({ relay }) => !userFavorites?.includes(relay))
          .map(({ relay, pubkeys }) => (
            <ErrorBoundary key={relay}>
              <RelayFeedRow relay={relay} pubkeys={pubkeys} />
            </ErrorBoundary>
          ))}
      </SimpleGrid>
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
