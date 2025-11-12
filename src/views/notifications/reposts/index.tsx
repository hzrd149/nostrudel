import { Box, Flex } from "@chakra-ui/react";
import { NostrEvent } from "nostr-tools";
import { useMemo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";

import {
  AddressPointer,
  EventPointer,
  getCoordinateFromAddressPointer,
  getSharedAddressPointer,
  getSharedEventPointer,
  insertEventIntoDescendingList,
} from "applesauce-core/helpers";
import { TimelineModel } from "applesauce-core/models";
import { useActiveAccount, useEventModel, useObservableEagerState } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";
import { ErrorBoundary } from "../../../components/error-boundary";
import SimpleView from "../../../components/layout/presets/simple-view";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import { useVirtualListScrollRestore } from "../../../hooks/use-scroll-restore";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import { shareNotificationsLoader$ } from "../../../services/notifications";
import RepostGroup from "./components/repost-group";

export type RepostGroup = {
  key: string;
  eventPointer: EventPointer;
  addressPointer: AddressPointer | undefined;
  events: NostrEvent[];
  latest: number;
};

function RepostGroupRow({ index, style, data }: ListChildComponentProps<RepostGroup[]>) {
  const group = data[index];
  const ref = useEventIntersectionRef(group.events[0]);

  return (
    <Box style={style} borderBottomWidth={1} ref={ref}>
      <ErrorBoundary>
        <RepostGroup group={group} />
      </ErrorBoundary>
    </Box>
  );
}

export default function SharesTab() {
  const loader = useObservableEagerState(shareNotificationsLoader$);
  const callback = useTimelineCurserIntersectionCallback(loader ?? undefined);
  const scroll = useVirtualListScrollRestore("manual");

  // Get account
  const account = useActiveAccount()!;

  // Get timeline of share events
  const events = useEventModel(TimelineModel, [{ kinds: [kinds.Repost, kinds.GenericRepost], "#p": [account.pubkey] }]);

  // Group share events by the shared event
  const groups = useMemo<RepostGroup[]>(() => {
    if (!events || events.length === 0) return [];

    const groups = new Map<string, RepostGroup>();

    for (const event of events) {
      // Try to get the shared event pointer
      const addressPointer = getSharedAddressPointer(event);
      const eventPointer = getSharedEventPointer(event);

      const key = addressPointer ? getCoordinateFromAddressPointer(addressPointer) : eventPointer!.id;
      if (!key) continue;

      // Create the group if it doesn't exist
      let group = groups.get(key);
      if (!group) {
        group = {
          key,
          eventPointer: eventPointer!,
          addressPointer: addressPointer,
          events: [],
          latest: event.created_at,
        };
        groups.set(key, group);
      }

      // Add the event to the group
      insertEventIntoDescendingList(group.events, event);
      group.latest = Math.max(group.latest, event.created_at);
    }

    // Convert to array and sort by most recent timestamp
    return Array.from(groups.values()).sort((a, b) => b.latest - a.latest);
  }, [events]);

  return (
    <IntersectionObserverProvider callback={callback}>
      <SimpleView title="Reposts" scroll={false} flush gap={0}>
        <Flex direction="column" flex={1}>
          {groups.length > 0 ? (
            <AutoSizer>
              {({ height, width }) => (
                <List
                  itemKey={(index, data) => data[index].key}
                  itemCount={groups.length}
                  itemSize={88}
                  itemData={groups}
                  width={width}
                  height={height}
                  {...scroll}
                >
                  {RepostGroupRow}
                </List>
              )}
            </AutoSizer>
          ) : (
            <Box mt="4" textAlign="center">
              No shares yet
            </Box>
          )}
        </Flex>
      </SimpleView>
    </IntersectionObserverProvider>
  );
}
