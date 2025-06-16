import { AvatarGroup, Button, Flex, Heading, Link, LinkBox, SimpleGrid } from "@chakra-ui/react";
import { useEventModel } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { Link as RouterLink } from "react-router-dom";

import HoverLinkOverlay from "../../components/hover-link-overlay";
import { ExternalLinkIcon } from "../../components/icons";
import WikiLink from "../../components/markdown/wiki-link";
import TimelineActionAndStatus from "../../components/timeline/timeline-action-and-status";
import UserAvatar from "../../components/user/user-avatar";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { WIKI_RELAYS } from "../../const";
import { WIKI_PAGE_KIND, validatePage } from "../../helpers/nostr/wiki";
import { useReadRelays } from "../../hooks/use-client-relays";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { WikiTopicsModel } from "../../models/wiki-topics";
import WikiSearchForm from "./components/wiki-search-form";

function eventFilter(event: NostrEvent) {
  if (!validatePage(event)) return false;
  return event.content.length > 0;
}

export default function WikiHomeView() {
  const relays = useReadRelays(WIKI_RELAYS);
  const { loader } = useTimelineLoader(`wiki-recent-pages`, relays, [{ kinds: [WIKI_PAGE_KIND] }], {
    eventFilter,
  });

  const topics = useEventModel(WikiTopicsModel, []) ?? [];

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
        {topics &&
          Object.entries(topics)
            .sort((a, b) => b[1].length - a[1].length)
            .map(([topic, events]) => (
              <LinkBox key={topic} p="2">
                <Heading size="md">
                  <HoverLinkOverlay as={RouterLink} to={`/wiki/topic/${topic}`}>
                    {topic}
                  </HoverLinkOverlay>
                </Heading>
                <AvatarGroup size="sm">
                  {events.map((page) => (
                    <UserAvatar pubkey={page.pubkey} />
                  ))}
                </AvatarGroup>
              </LinkBox>
            ))}
      </SimpleGrid>
      <TimelineActionAndStatus loader={loader} />
    </VerticalPageLayout>
  );
}
