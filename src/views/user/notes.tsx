import { useCallback } from "react";
import { Flex, Spacer } from "@chakra-ui/react";
import { useOutletContext } from "react-router-dom";
import { kinds } from "nostr-tools";

import { isReply, isRepost, truncatedId } from "../../helpers/nostr/event";
import { useAdditionalRelayContext } from "../../providers/local/additional-relay-context";
import { RelayIconStack } from "../../components/relay-icon-stack";
import { NostrEvent } from "../../types/nostr-event";
import useTimelineLoader from "../../hooks/use-timeline-loader";
import TimelineViewType from "../../components/timeline-page/timeline-view-type";
import TimelinePage, { useTimelinePageEventFilter } from "../../components/timeline-page";
import NoteFilterTypeButtons from "../../components/note-filter-type-buttons";
import { useRouteStateBoolean } from "../../hooks/use-route-state-value";

export default function UserNotesTab() {
  const { pubkey } = useOutletContext() as { pubkey: string };
  const readRelays = useAdditionalRelayContext();

  const showReplies = useRouteStateBoolean("show-replies", false);
  const showReposts = useRouteStateBoolean("show-reposts", true);

  const timelineEventFilter = useTimelinePageEventFilter();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (!showReplies.isOpen && isReply(event)) return false;
      if (!showReposts.isOpen && isRepost(event)) return false;
      return timelineEventFilter(event);
    },
    [showReplies.isOpen, showReposts.isOpen, timelineEventFilter],
  );
  const timeline = useTimelineLoader(
    truncatedId(pubkey) + "-notes",
    readRelays,
    {
      authors: [pubkey],
      kinds: [kinds.ShortTextNote, kinds.Repost, kinds.GenericRepost, 2],
    },
    { eventFilter },
  );

  const header = (
    <Flex gap="2" alignItems="center">
      <NoteFilterTypeButtons showReplies={showReplies} showReposts={showReposts} />
      <Spacer />
      <RelayIconStack relays={readRelays} direction="row-reverse" maxRelays={4} />
      <TimelineViewType />
    </Flex>
  );

  return <TimelinePage header={header} timeline={timeline} pt="2" pb="12" px="2" />;
}
