import { NostrEvent } from "nostr-tools";
import { Box, Card, Divider, Flex, Heading, Link, Spinner, Text } from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import useParamsAddressPointer from "../../hooks/use-params-address-pointer";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { getPageTitle, getPageTopic } from "../../helpers/nostr/wiki";
import WikiSearchForm from "./components/wiki-search-form";
import MarkdownContent from "./components/markdown";
import UserLink from "../../components/user/user-link";
import { getWebOfTrust } from "../../services/web-of-trust";
import useSubject from "../../hooks/use-subject";
import useWikiTopicTimeline from "./hooks/use-wiki-topic-timeline";
import WikiPageResult from "./components/wiki-page-result";
import Timestamp from "../../components/timestamp";

function WikiPagePage({ page }: { page: NostrEvent }) {
  const topic = getPageTopic(page);
  const timeline = useWikiTopicTimeline(topic);

  const pages = useSubject(timeline.timeline).filter((p) => p.pubkey !== page.pubkey);
  const sorted = getWebOfTrust().sortByDistanceAndConnections(pages, (p) => p.pubkey);

  return (
    <VerticalPageLayout>
      <Flex gap="2" wrap="wrap">
        <Heading mr="4">
          <Link as={RouterLink} to="/wiki">
            Wikifreedia
          </Link>
        </Heading>
        <WikiSearchForm w="full" />
      </Flex>

      <Box>
        <Heading>{getPageTitle(page)}</Heading>
        <Text>
          by <UserLink pubkey={page.pubkey} /> - <Timestamp timestamp={page.created_at} />
        </Text>
        <Divider my="2" />
        <MarkdownContent event={page} />
      </Box>

      {sorted.length > 0 && (
        <>
          <Heading size="lg" mt="4">
            Other Versions:
          </Heading>
          {sorted.slice(0, 6).map((page) => (
            <WikiPageResult key={page.id} page={page} />
          ))}
        </>
      )}
    </VerticalPageLayout>
  );
}

export default function WikiPageView() {
  const pointer = useParamsAddressPointer("naddr");
  const event = useReplaceableEvent(pointer, ["wss://relay.wikifreedia.xyz/"]);

  if (!event) return <Spinner />;
  return <WikiPagePage page={event} />;
}
