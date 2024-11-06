import { AvatarGroup, Link, Button, Flex, Heading, LinkBox, SimpleGrid, useInterval } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { NostrEvent } from "nostr-tools";

import VerticalPageLayout from "../../components/vertical-page-layout";
import WikiSearchForm from "./components/wiki-search-form";
import { WIKI_PAGE_KIND, validatePage } from "../../helpers/nostr/wiki";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { useReadRelays } from "../../hooks/use-client-relays";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import { WIKI_RELAYS } from "../../const";
import { ExternalLinkIcon } from "../../components/icons";
import WikiLink from "./components/wiki-link";
import { useEffect } from "react";
import dictionaryService from "../../services/dictionary";
import UserAvatar from "../../components/user/user-avatar";
import HoverLinkOverlay from "../../components/hover-link-overlay";
import useForceUpdate from "../../hooks/use-force-update";

function eventFilter(event: NostrEvent) {
  if (!validatePage(event)) return false;
  return event.content.length > 0;
}

export default function WikiHomeView() {
  const relays = useReadRelays(WIKI_RELAYS);
  const { loader, timeline: pages } = useTimelineLoader(`wiki-recent-pages`, relays, [{ kinds: [WIKI_PAGE_KIND] }], {
    eventFilter,
  });

  useEffect(() => {
    if (pages) {
      for (const page of pages) {
        dictionaryService.handleEvent(page);
      }
    }
  }, [pages]);

  const update = useForceUpdate();
  useInterval(update, 1000);

  return (
    <VerticalPageLayout>
      <Flex mx="auto" mt="10vh" mb="10vh" direction="column" alignItems="center" maxW="full">
        <Heading>
          <WikiLink topic="wikifreedia" color="inherit">
            Wikifreedia
          </WikiLink>
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
        {Array.from(dictionaryService.topics)
          .filter(([_, sub]) => !!sub.value && sub.value.size > 0)
          .sort((a, b) => b[1].value!.size - a[1].value!.size)
          .map(([topic, sub]) => (
            <LinkBox key={topic} p="2">
              <Heading size="md">
                <HoverLinkOverlay as={RouterLink} to={`/wiki/topic/${topic}`}>
                  {topic}
                </HoverLinkOverlay>
              </Heading>
              <AvatarGroup size="sm">
                {Array.from(sub.value!.values()).map((page) => (
                  <UserAvatar pubkey={page.pubkey} />
                ))}
              </AvatarGroup>
            </LinkBox>
          ))}
      </SimpleGrid>
      <TimelineActionAndStatus timeline={loader} />
    </VerticalPageLayout>
  );
}
