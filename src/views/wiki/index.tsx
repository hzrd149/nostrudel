import { Button, Flex, Heading, SimpleGrid } from "@chakra-ui/react";
import { Link } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { NostrEvent } from "nostr-tools";

import VerticalPageLayout from "../../components/vertical-page-layout";
import WikiSearchForm from "./components/wiki-search-form";
import { WIKI_PAGE_KIND, validatePage } from "../../helpers/nostr/wiki";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelays } from "../../hooks/use-client-relays";
import useSubject from "../../hooks/use-subject";
import WikiPageResult from "./components/wiki-page-result";
import TimelineActionAndStatus from "../../components/timeline-page/timeline-action-and-status";
import { ErrorBoundary } from "../../components/error-boundary";
import { WIKI_RELAYS } from "../../const";
import { ExternalLinkIcon } from "../../components/icons";

function eventFilter(event: NostrEvent) {
  if (!validatePage(event)) return false;
  return event.content.length > 0;
}

export default function WikiHomeView() {
  const relays = useReadRelays(WIKI_RELAYS);
  const timeline = useTimelineLoader(`wiki-recent-pages`, relays, [{ kinds: [WIKI_PAGE_KIND] }], { eventFilter });

  const pages = useSubject(timeline.timeline).filter((p) => p.content.length > 0);

  return (
    <VerticalPageLayout>
      <Flex mx="auto" mt="10vh" mb="10vh" direction="column" alignItems="center" maxW="full">
        <Heading>
          <Link as={RouterLink} to="/wiki/topic/wikifreedia">
            Wikifreedia
          </Link>
        </Heading>
        <Link isExternal color="blue.500" href="https://wikifreedia.xyz/">
          wikifreedia.xyz <ExternalLinkIcon />
        </Link>
        <WikiSearchForm maxW="full" mt="4" />
        <Button variant="link" p="2" mt="2" as={RouterLink} to="/wiki/create">
          Create Page
        </Button>
      </Flex>

      <Heading size="md" mt="4">
        Recent Updates:
      </Heading>
      <SimpleGrid spacing="2" columns={{ base: 1, lg: 2, xl: 3 }}>
        {pages.slice(0, 32).map((page) => (
          <ErrorBoundary key={page.id}>
            <WikiPageResult page={page} />
          </ErrorBoundary>
        ))}
      </SimpleGrid>
      <TimelineActionAndStatus timeline={timeline} />
    </VerticalPageLayout>
  );
}
