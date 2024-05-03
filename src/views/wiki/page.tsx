import { NostrEvent, nip19 } from "nostr-tools";
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  ButtonGroup,
  Divider,
  Flex,
  Heading,
  SimpleGrid,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";

import useParamsAddressPointer from "../../hooks/use-params-address-pointer";
import useReplaceableEvent from "../../hooks/use-replaceable-event";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { getPageDefer, getPageForks, getPageTitle, getPageTopic } from "../../helpers/nostr/wiki";
import MarkdownContent from "./components/markdown";
import UserLink from "../../components/user/user-link";
import { getWebOfTrust } from "../../services/web-of-trust";
import useSubject from "../../hooks/use-subject";
import useWikiTopicTimeline from "./hooks/use-wiki-topic-timeline";
import WikiPageResult from "./components/wiki-page-result";
import Timestamp from "../../components/timestamp";
import WikiPageHeader from "./components/wiki-page-header";
import { WIKI_RELAYS } from "../../const";
import GitBranch01 from "../../components/icons/git-branch-01";
import { ExternalLinkIcon } from "../../components/icons";
import FileSearch01 from "../../components/icons/file-search-01";
import NoteZapButton from "../../components/note/note-zap-button";
import ZapBubbles from "../../components/note/timeline-note/components/zap-bubbles";
import QuoteRepostButton from "../../components/note/quote-repost-button";
import WikiPageMenu from "./components/wiki-page-menu";
import EventVoteButtons from "../../components/reactions/event-vote-buttions";
import useCurrentAccount from "../../hooks/use-current-account";

function ForkAlert({ page, address }: { page: NostrEvent; address: nip19.AddressPointer }) {
  const topic = getPageTopic(page);

  return (
    <Alert status="info" display="flex" flexWrap="wrap">
      <AlertIcon>
        <GitBranch01 boxSize={5} />
      </AlertIcon>
      <Text>
        This page was forked from <UserLink pubkey={address.pubkey} fontWeight="bold" /> version
      </Text>
      <ButtonGroup variant="link" ml="auto">
        <Button leftIcon={<ExternalLinkIcon />} as={RouterLink} to={`/wiki/page/${nip19.naddrEncode(address)}`}>
          Original
        </Button>
        <Button
          leftIcon={<FileSearch01 />}
          as={RouterLink}
          to={`/wiki/compare/${topic}/${address.pubkey}/${page.pubkey}`}
        >
          Compare
        </Button>
      </ButtonGroup>
    </Alert>
  );
}

function DeferAlert({ page, address }: { page: NostrEvent; address: nip19.AddressPointer }) {
  return (
    <Alert status="warning" display="flex" flexWrap="wrap">
      <AlertIcon />
      <Text>
        The author of this page has deferred to <UserLink pubkey={address.pubkey} fontWeight="bold" /> version
      </Text>
      <Button
        leftIcon={<ExternalLinkIcon />}
        as={RouterLink}
        to={`/wiki/page/${nip19.naddrEncode(address)}`}
        variant="link"
        ml="4"
      >
        View
      </Button>
    </Alert>
  );
}

function WikiPagePage({ page }: { page: NostrEvent }) {
  const account = useCurrentAccount();
  const topic = getPageTopic(page);
  const timeline = useWikiTopicTimeline(topic);

  const pages = useSubject(timeline.timeline).filter((p) => p.pubkey !== page.pubkey);
  const { address } = getPageForks(page);
  const defer = getPageDefer(page);

  const forks = getWebOfTrust().sortByDistanceAndConnections(
    pages.filter((p) => getPageForks(p).address?.pubkey === page.pubkey),
    (p) => p.pubkey,
  );
  const other = getWebOfTrust().sortByDistanceAndConnections(
    pages.filter((p) => !forks.includes(p)),
    (p) => p.pubkey,
  );

  return (
    <VerticalPageLayout>
      <WikiPageHeader />

      <Flex gap="2" wrap="wrap">
        <Box flex={1}>
          <Heading>{getPageTitle(page)}</Heading>
          <Text>
            by <UserLink pubkey={page.pubkey} /> - <Timestamp timestamp={page.created_at} />
          </Text>
        </Box>
        <Flex direction="column" gap="2" ml="auto">
          <ButtonGroup ml="auto" size="sm">
            {page.pubkey === account?.pubkey && (
              <Button as={RouterLink} colorScheme="primary" to={`/wiki/edit/${getPageTopic(page)}`}>
                Edit
              </Button>
            )}
          </ButtonGroup>
          <Flex alignItems="flex-end" gap="2" ml="auto">
            <EventVoteButtons event={page} inline chevrons={false} />
            <ButtonGroup size="sm">
              <QuoteRepostButton event={page} />
              <NoteZapButton event={page} showEventPreview={false} />
              <WikiPageMenu page={page} aria-label="Page Options" />
            </ButtonGroup>
          </Flex>
        </Flex>
      </Flex>
      {address && <ForkAlert page={page} address={address} />}
      {defer?.address && <DeferAlert page={page} address={defer.address} />}
      <ZapBubbles event={page} />
      <Divider />
      <MarkdownContent event={page} />

      {forks.length > 0 && (
        <>
          <Heading size="lg" mt="4">
            Forks:
          </Heading>
          <SimpleGrid spacing="2" columns={{ base: 1, lg: 2, xl: 3 }}>
            {forks.map((p) => (
              <WikiPageResult key={p.id} page={p} compare={page} />
            ))}
          </SimpleGrid>
        </>
      )}
      {other.length > 0 && (
        <>
          <Heading size="lg" mt="4">
            Other Versions:
          </Heading>
          <SimpleGrid spacing="2" columns={{ base: 1, lg: 2, xl: 3 }}>
            {other.map((p) => (
              <WikiPageResult key={p.id} page={p} compare={page} />
            ))}
          </SimpleGrid>
        </>
      )}
    </VerticalPageLayout>
  );
}

export default function WikiPageView() {
  const pointer = useParamsAddressPointer("naddr");
  const event = useReplaceableEvent(pointer, WIKI_RELAYS);

  if (!event) return <Spinner />;
  return <WikiPagePage page={event} />;
}
