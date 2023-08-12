import { useCallback } from "react";
import { Flex, Switch, useDisclosure } from "@chakra-ui/react";

import { isReply } from "../../../helpers/nostr/event";
import { useAppTitle } from "../../../hooks/use-app-title";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import { NostrEvent } from "../../../types/nostr-event";
import TimelinePage, { useTimelinePageEventFilter } from "../../../components/timeline-page";
import TimelineViewTypeButtons from "../../../components/timeline-page/timeline-view-type";

export default function RelayNotes({ relay }: { relay: string }) {
  useAppTitle(`${relay} - Notes`);

  const showReplies = useDisclosure();

  const timelineEventFilter = useTimelinePageEventFilter();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (!showReplies.isOpen && isReply(event)) return false;
      return timelineEventFilter(event);
    },
    [showReplies.isOpen, timelineEventFilter]
  );
  const timeline = useTimelineLoader(`${relay}-notes`, [relay], { kinds: [1] }, { eventFilter });

  const header = (
    <Flex gap="2" pr="2" justifyContent="space-between" alignItems="center">
      <Switch isChecked={showReplies.isOpen} onChange={showReplies.onToggle} size="sm">
        Show Replies
      </Switch>
      <TimelineViewTypeButtons />
    </Flex>
  );

  return <TimelinePage timeline={timeline} header={header} />;
}
