import { SimpleGrid } from "@chakra-ui/react";

import VerticalPageLayout from "../../components/vertical-page-layout";
import DVMCard from "./components/dvm-card";
import { DMV_CONTENT_DISCOVERY_JOB_KIND } from "../../helpers/nostr/dvm";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelayUrls } from "../../hooks/use-client-relays";
import useSubject from "../../hooks/use-subject";
import RequireCurrentAccount from "../../providers/require-current-account";
import { getEventCoordinate } from "../../helpers/nostr/events";

function DVMFeedHomePage() {
  const readRelays = useReadRelayUrls();
  const timeline = useTimelineLoader("content-discovery-dvms", readRelays, {
    kinds: [31990],
    "#k": [String(DMV_CONTENT_DISCOVERY_JOB_KIND)],
  });

  const DMVs = useSubject(timeline.timeline).filter((e) => !e.tags.some((t) => t[0] === "web"));

  return (
    <VerticalPageLayout>
      <SimpleGrid columns={{ base: 1, md: 1, lg: 2, xl: 3 }} spacing="2">
        {DMVs.map((appData) => (
          <DVMCard key={appData.id} appData={appData} to={`/dvm/${getEventCoordinate(appData)}`} />
        ))}
      </SimpleGrid>
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
