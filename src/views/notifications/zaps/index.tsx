import { Box, Flex } from "@chakra-ui/react";
import {
  AddressPointer,
  EventPointer,
  getCoordinateFromAddressPointer,
  getZapAddressPointer,
  getZapEventPointer,
  insertEventIntoDescendingList,
  isValidZap,
  ZapEvent,
} from "applesauce-core/helpers";
import { TimelineModel } from "applesauce-core/models";
import { useActiveAccount, useEventModel, useObservableEagerState } from "applesauce-react/hooks";
import { kinds } from "nostr-tools";
import { useMemo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List, ListChildComponentProps } from "react-window";

import { ErrorBoundary } from "../../../components/error-boundary";
import SimpleView from "../../../components/layout/presets/simple-view";
import useEventIntersectionRef from "../../../hooks/use-event-intersection-ref";
import { useVirtualListScrollRestore } from "../../../hooks/use-scroll-restore";
import { useTimelineCurserIntersectionCallback } from "../../../hooks/use-timeline-cursor-intersection-callback";
import IntersectionObserverProvider from "../../../providers/local/intersection-observer";
import { zapNotificationsLoader$ } from "../../../services/notifications";
import ZapGroup from "./components/zap-group";

export type ZapGroup = {
  key: string;
  eventPointer: EventPointer;
  addressPointer?: AddressPointer;
  events: ZapEvent[];
  latest: number;
};

function ZapGroupRow({ index, style, data }: ListChildComponentProps<ZapGroup[]>) {
  const group = data[index];
  const ref = useEventIntersectionRef(group.events[0]);

  return (
    <Box style={style} borderBottomWidth={1} ref={ref}>
      <ErrorBoundary>
        <ZapGroup group={group} />
      </ErrorBoundary>
    </Box>
  );
}

// TODO: build an rxjs observable that groups events instead of needing to sort them every render
// export const groupedZaps$ = accounts.active$.pipe(
//   switchMap((account) => {
//     if (!account) return EMPTY;

//     return eventStore.filters({ kinds: [kinds.Zap], "#p": [account.pubkey] }).pipe(
//       // Filter for valid zaps
//       filter((e): e is ZapEvent => {
//         try {
//           return isValidZap(e);
//         } catch (error) {
//           return false;
//         }
//       }),
//       // Group by the zapped event
//       groupBy((e) => {
//         const eventPointer = getZapEventPointer(e) ?? undefined;
//         const addressPointer = getZapAddressPointer(e) ?? undefined;
//         return addressPointer ? getCoordinateFromAddressPointer(addressPointer) : eventPointer!.id;
//       }),
//     );
//   }),
// );

export default function ZapsTab() {
  const loader = useObservableEagerState(zapNotificationsLoader$);
  const callback = useTimelineCurserIntersectionCallback(loader ?? undefined);
  const scroll = useVirtualListScrollRestore("manual");

  // Get account
  const account = useActiveAccount()!;

  // Get timeline of zap events
  const events = useEventModel(TimelineModel, [{ kinds: [kinds.Zap], "#p": [account.pubkey] }])?.filter(
    (e): e is ZapEvent => {
      try {
        // Ensure the payment can be parsed
        return isValidZap(e);
      } catch (error) {
        return false;
      }
    },
  );

  // Filter valid zaps and group by the zapped event
  const groups = useMemo<ZapGroup[]>(() => {
    if (!events || events.length === 0) return [];

    const groups = new Map<string, ZapGroup>();

    for (const event of events) {
      // Try to get the zapped event pointer
      const eventPointer = getZapEventPointer(event) ?? undefined;
      const addressPointer = getZapAddressPointer(event) ?? undefined;

      const key = addressPointer ? getCoordinateFromAddressPointer(addressPointer) : eventPointer?.id;
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
      <SimpleView title="Zaps" scroll={false} flush gap={0}>
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
                  {ZapGroupRow}
                </List>
              )}
            </AutoSizer>
          ) : (
            <Box mt="4" textAlign="center">
              No zaps yet
            </Box>
          )}
        </Flex>
      </SimpleView>
    </IntersectionObserverProvider>
  );
}
