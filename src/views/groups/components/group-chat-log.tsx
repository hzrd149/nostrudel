import { mapEventsToStore } from "applesauce-core";
import { encodeGroupPointer, getSeenRelays, GROUP_MESSAGE_KIND, GroupPointer } from "applesauce-core/helpers";
import { TimelineModel } from "applesauce-core/models";
import { useEventModel, useEventStore } from "applesauce-react/hooks";
import { onlyEvents } from "applesauce-relay";
import { memo, useEffect, useMemo } from "react";

import { normalizeURL } from "nostr-tools/utils";
import TimelineActionAndStatus from "../../../components/timeline/timeline-action-and-status";
import { groupMessages } from "../../../helpers/nostr/dms";
import useClientSideMuteFilter from "../../../hooks/use-client-side-mute-filter";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import useTimelineLoader from "../../../hooks/use-timeline-loader";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import pool from "../../../services/pool";
import GroupMessageGroup from "./group-message-group";

const GroupChatLog = memo(({ group }: { group: GroupPointer }) => {
  const clientMuteFilter = useClientSideMuteFilter();
  const eventStore = useEventStore();

  const filter = useMemo(
    () => ({
      kinds: [GROUP_MESSAGE_KIND],
      "#h": [group.id],
    }),
    [group.id],
  );

  // Create timeline loader for loading old messages
  const { loader } = useTimelineLoader(`${encodeGroupPointer(group)}-messages`, [group.relay], filter, {
    eventFilter: (e) => !clientMuteFilter(e),
  });
  const callback = useTimelineCurserIntersectionCallback(loader);

  // Keep an active subscription to the relay
  useEffect(() => {
    const sub = pool
      .relay(group.relay)
      .subscription({ ...filter, limit: 10 }, { reconnect: true })
      .pipe(onlyEvents(), mapEventsToStore(eventStore))
      .subscribe();

    return () => sub.unsubscribe();
  }, [eventStore, group.relay, filter]);

  const messages =
    useEventModel(TimelineModel, [filter])?.filter((e) => getSeenRelays(e)?.has(normalizeURL(group.relay))) || [];

  const grouped = useMemo(() => groupMessages(Array.from(messages).reverse()).reverse(), [messages]);

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
