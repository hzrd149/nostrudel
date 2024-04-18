import { Box, Flex, Heading, SimpleGrid } from "@chakra-ui/react";
import { Link } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import VerticalPageLayout from "../../components/vertical-page-layout";
import WikiSearchForm from "./components/wiki-search-form";
import { WIKI_PAGE_KIND } from "../../helpers/nostr/wiki";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelays } from "../../hooks/use-client-relays";
import useSubject from "../../hooks/use-subject";
import { getWebOfTrust } from "../../services/web-of-trust";
import WikiPageResult from "./components/wiki-page-result";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";

export default function WikiHomeView() {
  const relays = useReadRelays(["wss://relay.wikifreedia.xyz/"]);
  const timeline = useTimelineLoader(`wiki-recent-pages`, relays, [{ kinds: [WIKI_PAGE_KIND] }]);

  const pages = useSubject(timeline.timeline).filter((p) => p.content.length > 0);
  const sorted = getWebOfTrust().sortByDistanceAndConnections(pages, (p) => p.pubkey);

  return (
    <VerticalPageLayout>
      <Flex mx="auto" mt="10vh" mb="10vh" direction="column" alignItems="center" maxW="full" gap="4">
        <Heading>
          <Link as={RouterLink} to="/wiki/topic/wikifreedia">
            Wikifreedia
          </Link>
        </Heading>
        <WikiSearchForm maxW="full" />
      </Flex>

      <Heading size="md" mt="4">
        Recent Updates:
      </Heading>
      <SimpleGrid spacing="2" columns={{ base: 1, lg: 2, xl: 3 }}>
        {sorted.map((page) => (
          <WikiPageResult key={page.id} page={page} />
        ))}
      </SimpleGrid>
      <TimelineActionAndStatus timeline={timeline} />
    </VerticalPageLayout>
  );
}
