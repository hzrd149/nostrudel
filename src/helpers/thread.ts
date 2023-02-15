import { NostrEvent } from "../types/nostr-event";
import { EventReferences, getReferences } from "./nostr-event";

export function countReplies(thread: ThreadItem): number {
  return thread.replies.reduce((c, item) => c + countReplies(item), 0) + thread.replies.length;
}

export type ThreadItem = {
  event: NostrEvent;
  root?: ThreadItem;
  reply?: ThreadItem;
  refs: EventReferences;
  replies: ThreadItem[];
};

export function linkEvents(events: NostrEvent[]) {
  const idToChildren: Record<string, NostrEvent[]> = {};

  const replies = new Map<string, ThreadItem>();
  for (const event of events) {
    const refs = getReferences(event);

    if (refs.replyId) {
      idToChildren[refs.replyId] = idToChildren[refs.replyId] || [];
      idToChildren[refs.replyId].push(event);
    }

    replies.set(event.id, {
      event,
      refs,
      replies: [],
    });
  }

  for (const [id, reply] of replies) {
    reply.root = reply.refs.rootId ? replies.get(reply.refs.rootId) : undefined;

    reply.reply = reply.refs.replyId ? replies.get(reply.refs.replyId) : undefined;

    reply.replies = idToChildren[id]?.map((e) => replies.get(e.id) as ThreadItem) ?? [];

    reply.replies.sort((a, b) => b.event.created_at - a.event.created_at);
  }

  return replies;
}
