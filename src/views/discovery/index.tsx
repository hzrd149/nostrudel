import { Card, Flex, Heading, Link, LinkBox, SimpleGrid, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import VerticalPageLayout from "../../components/vertical-page-layout";
import DVMCard from "./dvm-feed/components/dvm-card";
import { DVM_CONTENT_DISCOVERY_JOB_KIND } from "../../helpers/nostr/dvm";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelays } from "../../hooks/use-client-relays";
import useSubject from "../../hooks/use-subject";
import RequireCurrentAccount from "../../providers/route/require-current-account";
import { getEventCoordinate } from "../../helpers/nostr/event";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";
import Telescope from "../../components/icons/telescope";
import HoverLinkOverlay from "../../components/hover-link-overlay";
import { RelayIcon } from "../../components/icons";

function DVMFeeds() {
  const readRelays = useReadRelays();
  const timeline = useTimelineLoader("content-discovery-dvms", readRelays, {
    kinds: [31990],
    "#k": [String(DVM_CONTENT_DISCOVERY_JOB_KIND)],
  });

  const DMVs = useSubject(timeline.timeline).filter((e) => !e.tags.some((t) => t[0] === "web"));

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <>
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
          {DMVs.map((appData) => (
            <DVMCard key={appData.id} appData={appData} to={`/discovery/dvm/${getEventCoordinate(appData)}`} />
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
