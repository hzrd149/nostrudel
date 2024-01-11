import { Heading, Link, SimpleGrid, Text } from "@chakra-ui/react";

import VerticalPageLayout from "../../components/vertical-page-layout";
import DVMCard from "./components/dvm-card";
import { DVM_CONTENT_DISCOVERY_JOB_KIND } from "../../helpers/nostr/dvm";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import useSubject from "../../hooks/use-subject";
import RequireCurrentAccount from "../../providers/route/require-current-account";
import { getEventCoordinate } from "../../helpers/nostr/events";
import { useTimelineCurserIntersectionCallback } from "../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../providers/local/intersection-observer";

function DVMFeedHomePage() {
  const readRelays = useReadRelayUrls();
  const timeline = useTimelineLoader("content-discovery-dvms", readRelays, {
    kinds: [31990],
    "#k": [String(DVM_CONTENT_DISCOVERY_JOB_KIND)],
  });

  const DMVs = useSubject(timeline.timeline).filter((e) => !e.tags.some((t) => t[0] === "web"));

  const callback = useTimelineCurserIntersectionCallback(timeline);

  return (
    <VerticalPageLayout>
      <Heading size="md">DVM Feeds</Heading>
      <Text>
        Learn more about data vending machines here:{" "}
        <Link href="https://www.data-vending-machines.org/" isExternal color="blue.500">
          https://www.data-vending-machines.org/
        </Link>
      </Text>
      <IntersectionObserverProvider callback={callback}>
        <SimpleGrid columns={{ base: 1, md: 1, lg: 2, xl: 3 }} spacing="2">
          {DMVs.map((appData) => (
            <DVMCard key={appData.id} appData={appData} to={`/dvm/${getEventCoordinate(appData)}`} />
          ))}
        </SimpleGrid>
      </IntersectionObserverProvider>
    </VerticalPageLayout>
  );
}

export default function DVMFeedHomeView() {
  return (
    <RequireCurrentAccount>
      <DVMFeedHomePage />
    </RequireCurrentAccount>
  );
}
