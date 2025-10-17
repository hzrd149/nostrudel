import { Flex, Spacer, useDisclosure } from "@chakra-ui/react";
import { getSeenRelays } from "applesauce-core/helpers";
import { kinds } from "nostr-tools";
import { useCallback } from "react";

import { NostrEvent } from "nostr-tools";
import NoteFilterTypeButtons from "../../../../components/note-filter-type-buttons";
import TimelinePage, { useTimelinePageEventFilter } from "../../../../components/timeline-page";
import TimelineViewTypeButtons from "../../../../components/timeline-page/timeline-view-type";
import { isReply, isRepost } from "../../../../helpers/nostr/event";
import useClientSideMuteFilter from "../../../../hooks/use-client-side-mute-filter";
import useTimelineLoader from "../../../../hooks/use-timeline-loader";
import useRelayUrlParam from "../use-relay-url-param";

export default function RelayFeedView() {
  const relay = useRelayUrlParam();

  const showReplies = useDisclosure();
  const showReposts = useDisclosure({ defaultIsOpen: true });

  const timelineEventFilter = useTimelinePageEventFilter();
  const muteFilter = useClientSideMuteFilter();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (!getSeenRelays(event)?.has(relay)) return false;
      if (muteFilter(event)) return false;
      if (!showReplies.isOpen && isReply(event)) return false;
      if (!showReposts.isOpen && isRepost(event)) return false;
      return timelineEventFilter(event);
    },
    [timelineEventFilter, showReplies.isOpen, showReposts.isOpen, muteFilter],
  );
  const { loader, timeline } = useTimelineLoader(
    `relay-feed-${relay}`,
    [relay],
    {
      kinds: [kinds.ShortTextNote],
    },
    { eventFilter },
  );

  const header = (
    <Flex gap="2" wrap="wrap" px={["2", 0]}>
      <NoteFilterTypeButtons showReplies={showReplies} showReposts={showReposts} />
      <Spacer />
      <TimelineViewTypeButtons />
    </Flex>
  );

  if (!loader) return null;

  return <TimelinePage loader={loader} timeline={timeline} header={header} />;
}
