import { COMMENT_KIND } from "applesauce-common/helpers";
import { buildCommonEventRelationFilters } from "applesauce-core/helpers";
import { IEventStore } from "applesauce-core/event-store";
import { kinds as eventKinds } from "nostr-tools";

import { isDirectThreadReply } from "./thread";

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
