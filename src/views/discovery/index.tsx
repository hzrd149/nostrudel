import { Card, CardProps, Flex, Heading, Link, LinkBox, SimpleGrid, Text } from "@chakra-ui/react";
import { getEventUID, getRelaysFromList } from "applesauce-core/helpers";
import { kinds, NostrEvent } from "nostr-tools";
import { useCallback, useMemo } from "react";
import { Link as RouterLink } from "react-router-dom";

import { useActiveAccount } from "applesauce-react/hooks";
import DebugEventButton from "../../components/debug-modal/debug-event-button";
import { ErrorBoundary } from "../../components/error-boundary";
import HoverLinkOverlay from "../../components/hover-link-overlay";
import { RelayIcon } from "../../components/icons";
import Telescope from "../../components/icons/telescope";
import RequireActiveAccount from "../../components/router/require-active-account";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { DVM_CONTENT_DISCOVERY_JOB_KIND } from "../../helpers/nostr/dvm";
import { isEventInList } from "../../helpers/nostr/lists";
import useAddressableEvent from "../../hooks/use-addressable-event";
import { useReadRelays } from "../../hooks/use-client-relays";
import useFavoriteFeeds from "../../hooks/use-favorite-feeds";
import { useRelayInfo } from "../../hooks/use-relay-info";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import RelayCard from "../relays/components/relay-card";
import DVMCard from "./dvm-feed/components/dvm-card";
import RelayFavicon from "../../components/relay/relay-favicon";

function DVMFeeds() {
  const readRelays = useReadRelays();
  const eventFilter = useCallback((event: NostrEvent) => {
    return !event.tags.some((t) => t[0] === "web");
  }, []);
  const { loader, timeline: DVMs } = useTimelineLoader(
    "content-discovery-dvms",
    readRelays,
    {
      kinds: [kinds.Handlerinformation],
      "#k": [String(DVM_CONTENT_DISCOVERY_JOB_KIND)],
    },
    { eventFilter },
  );
  const callback = useTimelineCurserIntersectionCallback(loader);

  const { feeds: favoriteFeeds, favorites } = useFavoriteFeeds();

  return (
    <>
      {favoriteFeeds.length > 0 && (
        <>
          <Heading size="md" mt="4">
            Favorite Feeds
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 1, lg: 2, xl: 3, "2xl": 4 }} spacing="2">
            {favoriteFeeds.map((feed) => (
              <ErrorBoundary key={getEventUID(feed)} event={feed}>
                <DVMCard dvm={feed} />
              </ErrorBoundary>
            ))}
          </SimpleGrid>
        </>
      )}

      <Heading size="md" mt="4">
        DVM Feeds
      </Heading>
      <Text>
        Learn more about data vending machines here:{" "}
        <Link href="https://www.data-vending-machines.org/" isExternal color="blue.500">
          https://www.data-vending-machines.org/
        </Link>
      </Text>
      <IntersectionObserverProvider callback={callback}>
        <SimpleGrid columns={{ base: 1, md: 1, lg: 2, xl: 3, "2xl": 4 }} spacing="2">
          {DVMs.filter((feed) => !favorites || !isEventInList(favorites, feed)).map((feed) => (
            <ErrorBoundary key={getEventUID(feed)} event={feed}>
              <DVMCard dvm={feed} />
            </ErrorBoundary>
          ))}
        </SimpleGrid>
      </IntersectionObserverProvider>
    </>
  );
}

function RelayFeedCard({ relay, ...props }: { relay: string } & Omit<CardProps, "children">) {
  const { info } = useRelayInfo(relay);

  return (
    <Card as={LinkBox} display="block" p="4" {...props}>
      <Flex gap="2" float="right" zIndex={1}>
        {/* Favorite button goes here */}
      </Flex>
      <RelayFavicon relay={relay} float="left" mr="4" mb="2" />
      <Heading size="md">
        <HoverLinkOverlay as={RouterLink} to={`/discovery/relay/${encodeURIComponent(relay)}`}>
          {new URL(relay).hostname}
        </HoverLinkOverlay>
      </Heading>
      <Text noOfLines={2}>{info?.description}</Text>
    </Card>
  );
}

function FavoriteRelays() {
  const account = useActiveAccount()!;
  const favorites = useAddressableEvent({ kind: 10012, pubkey: account.pubkey });
  const relays = useMemo(() => favorites && getRelaysFromList(favorites), [favorites]);

  if (!relays) return null;

  return (
    <>
      <Heading size="md" mt="4">
        Favorite Relays
      </Heading>

      <SimpleGrid columns={{ base: 1, md: 1, lg: 2, xl: 3, "2xl": 4 }} spacing="2">
        {relays.map((relay) => (
          <RelayFeedCard key={relay} relay={relay} />
        ))}
      </SimpleGrid>
    </>
  );
}

function DiscoveryHomePage() {
  return (
    <VerticalPageLayout>
      <SimpleGrid columns={{ base: 1, md: 1, lg: 2, xl: 3, "2xl": 4 }} spacing="2">
        <Card as={LinkBox} display="block" p="4">
          <Telescope boxSize={16} float="left" ml="2" my="2" mr="6" />
          <Flex direction="column">
            <Heading size="md">
              <HoverLinkOverlay as={RouterLink} to="/discovery/blindspot">
                Blind spots
              </HoverLinkOverlay>
            </Heading>
            <Text>What are other users seeing that you are not?</Text>
          </Flex>
        </Card>
        <Card as={LinkBox} display="block" p="4">
          <RelayIcon boxSize={16} float="left" ml="2" my="2" mr="6" />
          <Flex direction="column">
            <Heading size="md">
              <HoverLinkOverlay as={RouterLink} to="/discovery/relays">
                Relays
              </HoverLinkOverlay>
            </Heading>
            <Text>See what notes are on relays and where they are</Text>
          </Flex>
        </Card>
      </SimpleGrid>
      <FavoriteRelays />
      <DVMFeeds />
    </VerticalPageLayout>
  );
}

export default function DiscoveryHomeView() {
  return (
    <RequireActiveAccount>
      <DiscoveryHomePage />
    </RequireActiveAccount>
  );
}
