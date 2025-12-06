import {
  getCoordinateFromAddressPointer,
  getZapAddressPointer,
  getZapEventPointer,
  insertEventIntoDescendingList,
  isValidZap,
  ZapEvent,
} from "applesauce-core/helpers";
import { withImmediateValueOrDefault } from "applesauce-core";
import type { AddressPointer, EventPointer } from "applesauce-core/helpers";
import { kinds } from "nostr-tools";
import { filter, map, Observable, of, scan, switchMap, throttleTime } from "rxjs";

import type { TZapGroup } from "../../helpers/nostr/zaps";
import { shareAndHold } from "../../helpers/observable";
import accounts from "../accounts";
import { eventStore } from "../event-store";

/**
 * Process a zap event and update the zap groups state
 */
function processZapNotification(groups: Map<string, TZapGroup>, event: ZapEvent): Map<string, TZapGroup> {
  // Try to get the zapped event pointer
  const eventPointer = getZapEventPointer(event) ?? undefined;
  const addressPointer = getZapAddressPointer(event) ?? undefined;

  const key = addressPointer ? getCoordinateFromAddressPointer(addressPointer) : eventPointer?.id;
  if (!key) return groups;

  // Create a new Map to maintain immutability
  const newGroups = new Map(groups);

  // Get or create the group
  const existingGroup = newGroups.get(key);
  if (!existingGroup) {
    const group: TZapGroup = {
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
    const group: TZapGroup = {
      ...existingGroup,
      events: insertEventIntoDescendingList([...existingGroup.events], event) as ZapEvent[],
      latest: Math.max(existingGroup.latest, event.created_at),
    };
    newGroups.set(key, group);
  }

  return newGroups;
}

/**
 * Convert zap groups Map to sorted array
 */
function getZapGroupsFromState(groups: Map<string, TZapGroup>): TZapGroup[] {
  return Array.from(groups.values()).sort((a, b) => b.latest - a.latest);
}

/** Observable stream of grouped zap notifications */
export const zapNotifications$: Observable<TZapGroup[]> = accounts.active$.pipe(
  switchMap((account) => {
    if (!account) return of([]);

    // Use eventStore.filters to get a stream of both existing and new zap events
    return eventStore
      .filters({
        kinds: [kinds.Zap],
        "#p": [account.pubkey],
      })
      .pipe(
        filter((event): event is ZapEvent => {
          // TODO: remove when isValidZap does not throw
          try {
            return isValidZap(event);
          } catch (error) {
            return false;
          }
        }),
        // Use scan to incrementally build zap groups from each event
        scan((groups, event) => processZapNotification(groups, event), new Map<string, TZapGroup>()),
        // Convert Map to sorted array
        map(getZapGroupsFromState),
      );
  }),
  // Ensure observable has an immediate value
  withImmediateValueOrDefault([]),
  // Share the observable to avoid duplicate processing
  shareAndHold(),
  // Place throttle after share so each subscription gets its own
  throttleTime(1000 / 30, undefined, { leading: true, trailing: true }), // 30fps
);
