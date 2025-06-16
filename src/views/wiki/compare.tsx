import { NostrEvent } from "nostr-tools";
import {
  Alert,
  AlertIcon,
  Box,
  ButtonGroup,
  Divider,
  Flex,
  Heading,
  IconButton,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { Navigate, useParams, Link as RouterLink } from "react-router-dom";

import useReplaceableEvent from "../../hooks/use-replaceable-event";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { WIKI_PAGE_KIND, getPageTitle } from "../../helpers/nostr/wiki";
import Timestamp from "../../components/timestamp";
import WikiPageHeader from "./components/wiki-page-header";
import DiffViewer from "../../components/diff/diff-viewer";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import MarkdownContent from "../../components/markdown/markdown";
import { WIKI_RELAYS } from "../../const";
import UserName from "../../components/user/user-name";
import WikiPageMenu from "./components/wiki-page-menu";
import { ExternalLinkIcon } from "../../components/icons";
import useShareableEventAddress from "../../hooks/use-shareable-event-address";

function WikiComparePage({ base, diff }: { base: NostrEvent; diff: NostrEvent }) {
  const vertical = useBreakpointValue({ base: true, lg: false }) ?? false;
  const identical = base.content.trim() === diff.content.trim();
  const baseAddress = useShareableEventAddress(base);
  const diffAddress = useShareableEventAddress(diff);

  return (
    <VerticalPageLayout>
      <WikiPageHeader />

      <Flex gap="4" direction={vertical ? "column" : "row"}>
        <Box flex={1}>
          <ButtonGroup float="right" size="sm">
            <IconButton
              as={RouterLink}
              to={`/wiki/page/${baseAddress}`}
              icon={<ExternalLinkIcon />}
              aria-label="Open Page"
            />
            <WikiPageMenu page={base} aria-label="Page Optinos" />
          </ButtonGroup>
          <Heading>
            <UserName pubkey={base.pubkey} />
          </Heading>
          <Text>
            {getPageTitle(base)} - <Timestamp timestamp={base.created_at} />
          </Text>
        </Box>
        <Box flex={1}>
          <ButtonGroup float="right" size="sm">
            <IconButton
              as={RouterLink}
              to={`/wiki/page/${diffAddress}`}
              icon={<ExternalLinkIcon />}
              aria-label="Open Page"
            />
            <WikiPageMenu page={diff} aria-label="Page Optinos" />
          </ButtonGroup>
          <Heading>
            <UserName pubkey={diff.pubkey} />
          </Heading>
          <Text>
            {getPageTitle(diff)} - <Timestamp timestamp={diff.created_at} />
          </Text>
        </Box>
      </Flex>
      <Divider />
      {identical ? (
        <>
          <Alert status="info">
            <AlertIcon />
            Both versions are identical
          </Alert>
          <MarkdownContent event={base} />
        </>
      ) : (
        <DiffViewer oldValue={base.content} newValue={diff.content} splitView={!vertical} />
      )}
    </VerticalPageLayout>
  );
}

export default function WikiCompareView() {
  const { topic, a, b } = useParams();
  if (!topic || !a || !b) return <Navigate to="/wiki" />;

  const base = useReplaceableEvent({ kind: WIKI_PAGE_KIND, identifier: topic, pubkey: a, relays: WIKI_RELAYS });
  const diff = useReplaceableEvent({ kind: WIKI_PAGE_KIND, identifier: topic, pubkey: b, relays: WIKI_RELAYS });

  if (!base || !diff) return <Spinner />;
  return <WikiComparePage base={base} diff={diff} />;
}
