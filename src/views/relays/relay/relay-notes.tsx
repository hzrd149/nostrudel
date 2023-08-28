import { useCallback, useMemo } from "react";
import { Flex, Spacer } from "@chakra-ui/react";
import { Kind } from "nostr-tools";

import { isReply } from "../../../helpers/nostr/events";
import { useAppTitle } from "../../../hooks/use-app-title";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import { NostrEvent } from "../../../types/nostr-event";
import TimelinePage, { useTimelinePageEventFilter } from "../../../components/timeline-page";
import TimelineViewTypeButtons from "../../../components/timeline-page/timeline-view-type";
import PeopleListSelection from "../../../components/people-list-selection/people-list-selection";
import { usePeopleListContext } from "../../../providers/people-list-provider";
import { NostrRequestFilter } from "../../../types/nostr-query";

export default function RelayNotes({ relay }: { relay: string }) {
  useAppTitle(`${relay} - Notes`);

  const { filter } = usePeopleListContext();
  const kinds = [Kind.Text];
  const query = useMemo<NostrRequestFilter>(() => {
    if (filter === undefined) return { kinds };
    return { ...filter, kinds };
  }, [filter]);

  const timelineEventFilter = useTimelinePageEventFilter();
  const eventFilter = useCallback(
    (event: NostrEvent) => {
      if (!isReply(event)) return false;
      return timelineEventFilter(event);
    },
    [timelineEventFilter],
  );
  const timeline = useTimelineLoader(`${relay}-notes`, [relay], query, { eventFilter, enabled: !!filter });

  const header = (
    <Flex gap="2" wrap="wrap" px={["2", 0]}>
      <PeopleListSelection />
      <Spacer />
      <TimelineViewTypeButtons />
    </Flex>
  );

  return <TimelinePage timeline={timeline} header={header} />;
}
