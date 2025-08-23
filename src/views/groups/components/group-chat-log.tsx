import { encodeGroupPointer, GROUP_MESSAGE_KIND, GroupPointer } from "applesauce-core/helpers";
import { memo, useMemo } from "react";

import TimelineActionAndStatus from "../../../components/timeline/timeline-action-and-status";
import { groupMessages } from "../../../helpers/nostr/dms";
import useClientSideMuteFilter from "../../../hooks/use-client-side-mute-filter";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import GroupMessageGroup from "./group-message-group";

const GroupChatLog = memo(({ group }: { group: GroupPointer }) => {
  const clientMuteFilter = useClientSideMuteFilter();
  const { loader, timeline } = useTimelineLoader(
    `${encodeGroupPointer(group)}-messages`,
    [group.relay],
    {
      kinds: [GROUP_MESSAGE_KIND],
      "#h": [group.id],
    },
    {
      eventFilter: (e) => !clientMuteFilter(e),
    },
  );
  const callback = useTimelineCurserIntersectionCallback(loader);

  const grouped = useMemo(() => groupMessages(Array.from(timeline).reverse()).reverse(), [timeline]);

  return (
    <IntersectionObserverProvider callback={callback}>
      {grouped.map((group) => (
        <GroupMessageGroup key={group[0].id} messages={group} />
      ))}
      <TimelineActionAndStatus loader={loader} />
    </IntersectionObserverProvider>
  );
});

export default GroupChatLog;
