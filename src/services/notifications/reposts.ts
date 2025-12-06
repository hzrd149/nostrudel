import {
  getCoordinateFromAddressPointer,
  getSharedAddressPointer,
  getSharedEventPointer,
  insertEventIntoDescendingList,
} from "applesauce-core/helpers";
import { withImmediateValueOrDefault } from "applesauce-core";
import type { AddressPointer, EventPointer } from "applesauce-core/helpers";
import { kinds, NostrEvent } from "nostr-tools";
import { map, Observable, of, scan, switchMap, throttleTime } from "rxjs";

import { shareAndHold } from "../../helpers/observable";
import accounts from "../accounts";
import { eventStore } from "../event-store";

export type TRepostGroup = {
  key: string;
  eventPointer: EventPointer;
  addressPointer: AddressPointer | undefined;
  events: NostrEvent[];
  latest: number;
};

/**
 * Process a repost event and update the repost groups state
 */
function processRepostNotification(groups: Map<string, TRepostGroup>, event: NostrEvent): Map<string, TRepostGroup> {
  // Try to get the shared event pointer
  const addressPointer = getSharedAddressPointer(event) ?? undefined;
  const eventPointer = getSharedEventPointer(event) ?? undefined;

  const key = addressPointer ? getCoordinateFromAddressPointer(addressPointer) : eventPointer?.id;
  if (!key) return groups;

  // Create a new Map to maintain immutability
  const newGroups = new Map(groups);

  // Get or create the group
  const existingGroup = newGroups.get(key);
  if (!existingGroup) {
    const group: TRepostGroup = {
      key,
      eventPointer: eventPointer!,
      addressPointer: addressPointer,
      events: [event],
      latest: event.created_at,
    };
    newGroups.set(key, group);
  } else {
    // Check if event is already in the group
    if (existingGroup.events.some((e) => e.id === event.id)) return groups;

    // Create a new group object with updated events
    const group: TRepostGroup = {
      ...existingGroup,
      events: insertEventIntoDescendingList([...existingGroup.events], event),
      latest: Math.max(existingGroup.latest, event.created_at),
    };
    newGroups.set(key, group);
  }

  return newGroups;
}

/**
 * Convert repost groups Map to sorted array
 */
function getRepostGroupsFromState(groups: Map<string, TRepostGroup>): TRepostGroup[] {
  return Array.from(groups.values()).sort((a, b) => b.latest - a.latest);
}

/** Observable stream of grouped repost notifications */
export const repostNotifications$: Observable<TRepostGroup[]> = accounts.active$.pipe(
  switchMap((account) => {
    if (!account) return of([]);

    // Use eventStore.filters to get a stream of both existing and new repost events
    return eventStore
      .filters({
        kinds: [kinds.Repost, kinds.GenericRepost],
        "#p": [account.pubkey],
      })
      .pipe(
        // Use scan to incrementally build repost groups from each event
        scan((groups, event) => processRepostNotification(groups, event), new Map<string, TRepostGroup>()),
        // Convert Map to sorted array
        map(getRepostGroupsFromState),
        // Throttle updates to avoid excessive re-renders
        throttleTime(500, undefined, { leading: true, trailing: true }),
      );
  }),
  // Ensure observable has an immediate value
  withImmediateValueOrDefault([]),
  // Share the observable to avoid duplicate processing
  shareAndHold(),
  // Place throttle after share so each subscription gets its own
  throttleTime(1000 / 30, undefined, { leading: true, trailing: true }), // 30fps
);
