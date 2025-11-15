import { Box, Button, Divider, Flex, Heading, Link, Spacer, Text } from "@chakra-ui/react";
import { useActiveAccount, useEventModel, useObservableEagerMemo } from "applesauce-react/hooks";
import { NostrEvent } from "nostr-tools";
import { useCallback } from "react";
import { map, of, throttleTime } from "rxjs";

import NoteFilterTypeButtons from "../../components/note-filter-type-buttons";
import OutboxRelaySelectionModal from "../../components/outbox-relay-selection-modal";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import RouterLink from "../../components/router-link";
import TimelinePage, { useTimelinePageEventFilter } from "../../components/timeline-page";
import { GENERIC_TIMELINE_KINDS } from "../../components/timeline-page/generic-note-timeline";
import TimelineViewTypeButtons from "../../components/timeline-page/timeline-view-type";
import VerticalPageLayout from "../../components/vertical-page-layout";
import { isReply, isRepost } from "../../helpers/nostr/event";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import useLocalStorageDisclosure from "../../hooks/use-localstorage-disclosure";
import { useOutboxTimelineLoader } from "../../hooks/use-outbox-timeline-loader";
import { OutboxSelectionModel } from "../../models/outbox-selection";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import { eventStore } from "../../services/event-store";

function HomePage() {
  const showReplies = useLocalStorageDisclosure("show-replies", false);
  const showReposts = useLocalStorageDisclosure("show-reposts", true);

  const timelinePageEventFilter = useTimelinePageEventFilter();
  const muteFilter = useClientSideMuteFilter();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (muteFilter(event)) return false;
      if (!showReplies.isOpen && isReply(event)) return false;
      if (!showReposts.isOpen && isRepost(event)) return false;
      return timelinePageEventFilter(event);
    },
    [timelinePageEventFilter, showReplies.isOpen, showReposts.isOpen, muteFilter],
  );

  const { filter, pointer } = usePeopleListContext();
  const { selection, outboxes } = useEventModel(OutboxSelectionModel, pointer ? [pointer] : undefined) ?? {};

  // Get or create the outbox timeline loader
  const loader = useOutboxTimelineLoader(pointer, filter && { ...filter, kinds: GENERIC_TIMELINE_KINDS });

  // Subscribe to event store for timeline events
  const timeline = useObservableEagerMemo(
    () =>
      filter
        ? eventStore.timeline({ ...filter, kinds: GENERIC_TIMELINE_KINDS }).pipe(
            throttleTime(500),
            map((events) => events.filter(eventFilter)),
          )
        : of([]),
    [filter, eventFilter],
  );

  const header = (
    <Flex gap="2" wrap="wrap" alignItems="center">
      <PeopleListSelection />
      <NoteFilterTypeButtons showReplies={showReplies} showReposts={showReposts} />
      <Spacer />
      {outboxes && selection && <OutboxRelaySelectionModal outboxMap={outboxes} selection={selection} />}
      <TimelineViewTypeButtons />
    </Flex>
  );

  return <TimelinePage loader={loader} timeline={timeline} header={header} pt="2" pb="12" px="2" maxW="6xl" />;
}

export default function HomeView() {
  const account = useActiveAccount();

  // Welcome screen
  if (!account)
    return (
      <VerticalPageLayout>
        <Box textAlign="center">
          <Heading size="lg" mt={20} pb={4}>
            Welcome to noStrudel
          </Heading>
          <Text my={10}>
            Get started by either signing in with a{" "}
            <Link isExternal href="https://nostr.com" color="blue.500">
              Nostr Account
            </Link>{" "}
            or browse some existing relays.
          </Text>
          <Button as={RouterLink} to="/signin" size="lg" minW="xs" colorScheme="primary">
            Sign in
          </Button>
          <Flex maxW="6xl" mx="auto" my="4" gap={4} align="center">
            <Divider />
            <Text fontWeight="bold" fontSize="md" whiteSpace="pre">
              OR
            </Text>
            <Divider />
          </Flex>
          <Button as={RouterLink} to="/feeds/relays" size="lg" minW="xs">
            Browse relays
          </Button>
        </Box>
      </VerticalPageLayout>
    );

  return (
    <PeopleListProvider>
      <HomePage />
    </PeopleListProvider>
  );
}
