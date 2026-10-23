import { ThreadEvent } from "../../helpers/nostr/thread";

import { sortByDate } from "../../helpers/nostr/event";

export function repliesByDate(notes: ThreadEvent[]): ThreadEvent[] {
  return [...notes].sort((a, b) => sortByDate(a.event, b.event));
}
