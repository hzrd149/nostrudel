import { getNip10References } from "applesauce-common/helpers";
import { IEventStore } from "applesauce-core/event-store";
import { kinds as eventKinds } from "nostr-tools";

/**
 * Recursively counts descendants of an event using only what's currently in the
 * event store (no extra subscriptions). Walks "#e" matches and filters to direct
 * NIP-10 replies at each level.
 */
export function countDescendantsInStore(
  eventId: string,
  store: IEventStore,
  kinds: number[] = [eventKinds.ShortTextNote],
  seen: Set<string> = new Set(),
): number {
  if (seen.has(eventId)) return 0;
  seen.add(eventId);

  const matches = store.getByFilters({ "#e": [eventId], kinds });
  let total = 0;
  for (const event of matches) {
    const refs = getNip10References(event);
    // Only count direct replies — NIP-10 reply pointer must match this event id.
    if (refs.reply?.e?.id !== eventId) continue;
    total += 1 + countDescendantsInStore(event.id, store, kinds, seen);
  }
  return total;
}
