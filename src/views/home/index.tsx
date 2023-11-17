import { useCallback, useEffect, useMemo } from "react";
import { Flex, useDisclosure } from "@chakra-ui/react";
import { Kind } from "nostr-tools";

import { isReply, isRepost } from "../../helpers/nostr/events";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import { NostrEvent } from "../../types/nostr-event";
import TimelinePage, { useTimelinePageEventFilter } from "../../components/timeline-page";
import TimelineViewTypeButtons from "../../components/timeline-page/timeline-view-type";
import PeopleListSelection from "../../components/people-list-selection/people-list-selection";
import RelaySelectionButton from "../../components/relay-selection/relay-selection-button";
import PeopleListProvider, { usePeopleListContext } from "../../providers/people-list-provider";
import RelaySelectionProvider, { useRelaySelectionContext } from "../../providers/relay-selection-provider";
import { NostrRequestFilter } from "../../types/nostr-query";
import useClientSideMuteFilter from "../../hooks/use-client-side-mute-filter";
import NoteFilterTypeButtons from "../../components/note-filter-type-buttons";

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

  const { relays } = useRelaySelectionContext();
  const { listId, filter } = usePeopleListContext();

  const kinds = [Kind.Text, Kind.Repost, Kind.Article, Kind.RecommendRelay, Kind.BadgeAward];
  const query = useMemo<NostrRequestFilter>(() => {
    if (filter === undefined) return { kinds };
    return { ...filter, kinds };
  }, [filter]);

  const timeline = useTimelineLoader(`${listId}-home-feed`, relays, query, {
    enabled: !!filter,
    eventFilter,
  });

  const header = (
    <Flex gap="2" wrap="wrap" px={["2", 0]} alignItems="center">
      <PeopleListSelection />
      <NoteFilterTypeButtons showReplies={showReplies} showReposts={showReposts} />
      <RelaySelectionButton ml="auto" />
      <TimelineViewTypeButtons />
    </Flex>
  );

  return <TimelinePage timeline={timeline} header={header} pt="2" pb="12" px="2" />;
}

export default function HomeView() {
  return (
    <PeopleListProvider>
      <RelaySelectionProvider>
        <HomePage />
      </RelaySelectionProvider>
    </PeopleListProvider>
  );
}
