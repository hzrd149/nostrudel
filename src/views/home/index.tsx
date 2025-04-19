import { useCallback, useEffect } from "react";
import { Flex, Spacer, useDisclosure } from "@chakra-ui/react";
import { kinds } from "nostr-tools";

import { isReply, isRepost } from "../../helpers/nostr/event";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { NostrEvent } from "nostr-tools";
import TimelinePage, { useTimelinePageEventFilter } from "../../components/timeline-page";
import TimelineViewTypeButtons from "../../components/timeline-page/timeline-view-type";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import PeopleListProvider, { usePeopleListContext } from "../../providers/local/people-list-provider";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import NoteFilterTypeButtons from "../../components/note-filter-type-buttons";
import KindSelectionProvider, { useKindSelectionContext } from "../../providers/local/kind-selection-provider";
import { useReadRelays } from "../../hooks/use-client-relays";

const defaultKinds = [kinds.ShortTextNote, kinds.Repost, kinds.GenericRepost];

function HomePage() {
  const showReplies = useDisclosure({ defaultIsOpen: localStorage.getItem("show-replies") === "true" });
  const showReposts = useDisclosure({ defaultIsOpen: localStorage.getItem("show-reposts") !== "false" });

  // save toggles to localStorage when changed
  useEffect(() => {
    localStorage.setItem("show-replies", String(showReplies.isOpen));
    localStorage.setItem("show-reposts", String(showReposts.isOpen));
  }, [showReplies.isOpen, showReposts.isOpen]);

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

  const relays = useReadRelays();
  const { listId, filter } = usePeopleListContext();
  const { kinds } = useKindSelectionContext();

  const { loader, timeline } = useTimelineLoader(
    `${listId}-home-feed`,
    relays,
    filter ? { ...filter, kinds } : undefined,
    {
      eventFilter,
    },
  );

  const header = (
    <Flex gap="2" wrap="wrap" alignItems="center">
      <PeopleListSelection />
      <NoteFilterTypeButtons showReplies={showReplies} showReposts={showReposts} />
      <Spacer />
      <TimelineViewTypeButtons />
    </Flex>
  );

  return <TimelinePage loader={loader} timeline={timeline} header={header} pt="2" pb="12" px="2" />;
}

export default function HomeView() {
  return (
    <PeopleListProvider>
      <KindSelectionProvider initKinds={defaultKinds}>
        <HomePage />
      </KindSelectionProvider>
    </PeopleListProvider>
  );
}
