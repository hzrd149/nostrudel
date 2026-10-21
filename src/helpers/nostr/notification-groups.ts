import {
  getSharedAddressPointer,
  getSharedEventPointer,
  getZapAddressPointer,
  getZapEventPointer,
  getZapSender,
  isValidZap,
  MutedThings,
} from "applesauce-common/helpers";
import { AddressPointer, EventPointer, getReplaceableAddressFromPointer } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";

import type { TZapGroup } from "./zaps";
import { isMutedNotification } from "./notifications";

export type TRepostGroup = {
  key: string;
  eventPointer: EventPointer;
  addressPointer: AddressPointer | undefined;
  events: NostrEvent[];
  latest: number;
};

/** The input is the store's deduplicated, descending timeline. */
export function getRepostGroups(events: NostrEvent[], user: string, mutes?: MutedThings): TRepostGroup[] {
  const groups = new Map<string, TRepostGroup>();
  for (const event of events) {
    if (isMutedNotification(event, user, mutes)) continue;
    const addressPointer = getSharedAddressPointer(event) ?? undefined;
    const eventPointer = getSharedEventPointer(event) ?? undefined;
    const key = addressPointer ? getReplaceableAddressFromPointer(addressPointer) : eventPointer?.id;
    if (!key) continue;
    const group = groups.get(key);
    if (group) group.events.push(event);
    else
      groups.set(key, { key, eventPointer: eventPointer!, addressPointer, events: [event], latest: event.created_at });
  }
  return [...groups.values()];
}

export function getZapGroups(events: NostrEvent[], user: string, mutes?: MutedThings): TZapGroup[] {
  const groups = new Map<string, TZapGroup>();
  for (const event of events) {
    if (!isValidZap(event) || isMutedNotification({ ...event, pubkey: getZapSender(event) }, user, mutes)) continue;
    const addressPointer = getZapAddressPointer(event) ?? undefined;
    const eventPointer = getZapEventPointer(event) ?? undefined;
    const key = addressPointer ? getReplaceableAddressFromPointer(addressPointer) : eventPointer?.id;
    if (!key) continue;
    const group = groups.get(key);
    if (group) group.events.push(event);
    else
      groups.set(key, { key, eventPointer: eventPointer!, addressPointer, events: [event], latest: event.created_at });
  }
  return [...groups.values()];
}
