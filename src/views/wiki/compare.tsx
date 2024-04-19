import { NostrEvent } from "nostr-tools";
import { Alert, AlertIcon, Box, ButtonGroup, Divider, Flex, Heading, Spinner, Text } from "@chakra-ui/react";
import { Navigate, useParams } from "react-router-dom";

import useReplaceableEvent from "../../hooks/use-replaceable-event";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { WIKI_PAGE_KIND, getPageTitle } from "../../helpers/nostr/wiki";
import Timestamp from "../../components/timestamp";
import DebugEventButton from "../../components/debug-modal/debug-event-button";
import WikiPageHeader from "./components/wiki-page-header";
import DiffViewer from "../../components/diff/diff-viewer";
import { useBreakpointValue } from "../../providers/global/breakpoint-provider";
import MarkdownContent from "./components/markdown";
import { WIKI_RELAYS } from "../../const";
import UserName from "../../components/user/user-name";

function WikiComparePage({ base, diff }: { base: NostrEvent; diff: NostrEvent }) {
  const vertical = useBreakpointValue({ base: true, lg: false }) ?? false;
  const identical = base.content.trim() === diff.content.trim();

  return (
    <VerticalPageLayout>
      <WikiPageHeader />

      <Flex gap="4" direction={vertical ? "column" : "row"}>
        <Box flex={1}>
          <ButtonGroup float="right">
            <DebugEventButton event={base} />
          </ButtonGroup>
          <Heading>
            <UserName pubkey={base.pubkey} />
          </Heading>
          <Text>
            {getPageTitle(base)} - <Timestamp timestamp={base.created_at} />
          </Text>
        </Box>
        <Box flex={1}>
          <ButtonGroup float="right">
            <DebugEventButton event={diff} />
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

  const base = useReplaceableEvent({ kind: WIKI_PAGE_KIND, identifier: topic, pubkey: a }, WIKI_RELAYS);
  const diff = useReplaceableEvent({ kind: WIKI_PAGE_KIND, identifier: topic, pubkey: b }, WIKI_RELAYS);

  if (!base || !diff) return <Spinner />;
  return <WikiComparePage base={base} diff={diff} />;
}
