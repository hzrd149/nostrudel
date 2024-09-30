import { ThreadItem } from "applesauce-core/queries";
import { sortByDate } from "./nostr/event";

export function countReplies(replies: Set<ThreadItem> | ThreadItem[]): number {
  return (
    Array.from(replies).reduce((c, item) => c + countReplies(item.replies), 0) +
    (Array.isArray(replies) ? replies.length : replies.size)
  );
}

/** Returns an array of all pubkeys participating in the thread */
export function getThreadMembers(item: ThreadItem, omit?: string) {
  const pubkeys = new Set<string>();

  let next = item;
  while (true) {
    if (next.event.pubkey !== omit) pubkeys.add(next.event.pubkey);
    if (!next.parent) break;
    else next = next.parent;
  }

  return Array.from(pubkeys);
}

export function repliesByDate(item: ThreadItem) {
  return Array.from(item.replies).sort((a, b) => sortByDate(a.event, b.event));
}
