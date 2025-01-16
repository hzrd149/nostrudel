import { useCallback } from "react";
import { Card, Flex, Heading, Link, LinkBox, SimpleGrid, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router";
import { getEventUID } from "applesauce-core/helpers";
import { kinds, NostrEvent } from "nostr-tools";

import VerticalPageLayout from "../../components/vertical-page-layout";
import DVMCard from "./dvm-feed/components/dvm-card";
import { DVM_CONTENT_DISCOVERY_JOB_KIND } from "../../helpers/nostr/dvm";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelays } from "../../hooks/use-client-relays";
import RequireCurrentAccount from "../../components/router/require-current-account";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import Telescope from "../../components/icons/telescope";
import HoverLinkOverlay from "../../components/hover-link-overlay";
import { RelayIcon } from "../../components/icons";
import useFavoriteFeeds from "../../hooks/use-favorite-feeds";
import { isEventInList } from "../../helpers/nostr/lists";
import { ErrorBoundary } from "../../components/error-boundary";

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
          <SimpleGrid columns={{ base: 1, md: 1, lg: 2, xl: 3 }} spacing="2">
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
        <SimpleGrid columns={{ base: 1, md: 1, lg: 2, xl: 3 }} spacing="2">
          {DVMs.filter((feed) => !isEventInList(favorites, feed)).map((feed) => (
            <ErrorBoundary key={getEventUID(feed)} event={feed}>
              <DVMCard dvm={feed} />
            </ErrorBoundary>
          ))}
        </SimpleGrid>
      </IntersectionObserverProvider>
    </>
  );
}

function DiscoveryHomePage() {
  return (
    <VerticalPageLayout>
      <SimpleGrid columns={{ base: 1, md: 1, lg: 2, xl: 3 }} spacing="2">
        <Card as={LinkBox} display="block" p="4" maxW="lg">
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
        <Card as={LinkBox} display="block" p="4" maxW="lg">
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
      <DVMFeeds />
    </VerticalPageLayout>
  );
}

export default function DiscoveryHomeView() {
  return (
    <RequireCurrentAccount>
      <DiscoveryHomePage />
    </RequireCurrentAccount>
  );
}
