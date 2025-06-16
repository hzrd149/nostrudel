import { ThreadItem } from "applesauce-core/models";
import { sortByDate } from "./nostr/event";

export function countReplies(replies: Set<ThreadItem> | ThreadItem[]): number {
  return (
    Array.from(replies).reduce((c, item) => c + countReplies(item.replies), 0) +
    (Array.isArray(replies) ? replies.length : replies.size)
  );
}

export function repliesByDate(item: ThreadItem) {
  return Array.from(item.replies).sort((a, b) => sortByDate(a.event, b.event));
}
