import { COMMENT_KIND } from "applesauce-common/helpers";
import { buildCommonEventRelationFilters, getAddressPointerForEvent } from "applesauce-core/helpers";
import { IEventStore } from "applesauce-core/event-store";
import { kinds as eventKinds, NostrEvent } from "nostr-tools";

import { getThreadParent, getThreadScopeKey, isDirectThreadReply } from "./thread";

/**
 * Recursively counts descendants of an event using only what's currently in the
 * event store (no extra subscriptions), using each protocol's direct-parent reference.
 */
export function countDescendantsInStore(
  eventId: string,
  store: IEventStore,
  kinds: number[] = [eventKinds.ShortTextNote, COMMENT_KIND],
  seen: Set<string> = new Set(),
): number {
  if (seen.has(eventId)) return 0;
  seen.add(eventId);

  const parent = store.getEvent(eventId) ?? eventId;
  const matches = store.getByFilters(buildCommonEventRelationFilters({ kinds }, parent));
  let total = 0;
  for (const event of matches) {
    if (seen.has(event.id) || !isDirectThreadReply(event, parent)) continue;
    total += 1 + countDescendantsInStore(event.id, store, kinds, seen);
  }
  return total;
}

/** Count a reactive timeline snapshot without requiring synchronous store queries. */
export function countDescendantsInTimeline(parent: NostrEvent, events: NostrEvent[]): number {
  const children = new Map<string, NostrEvent[]>();
  for (const event of events) {
    const pointer = getThreadParent(event);
    if (!pointer) continue;
    const key = getThreadScopeKey(pointer);
    const siblings = children.get(key) ?? [];
    siblings.push(event);
    children.set(key, siblings);
  }

  const seen = new Set<string>([parent.id]);
  const pending = [parent];
  let count = 0;
  while (pending.length > 0) {
    const current = pending.pop()!;
    const address = getAddressPointerForEvent(current);
    const candidates = [
      ...(children.get(current.id) ?? []),
      ...(address ? (children.get(getThreadScopeKey(address)) ?? []) : []),
    ];
    for (const child of candidates) {
      if (seen.has(child.id) || !isDirectThreadReply(child, current)) continue;
      seen.add(child.id);
      count++;
      pending.push(child);
    }
  }
  return count;
}
