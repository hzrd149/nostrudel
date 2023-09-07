import { NostrEvent } from "../types/nostr-event";
import { EventReferences, getReferences } from "./nostr/events";

export function countReplies(thread: ThreadItem): number {
  return thread.replies.reduce((c, item) => c + countReplies(item), 0) + thread.replies.length;
}

export type ThreadItem = {
  /** underlying nostr event */
  event: NostrEvent;
  /** the thread root, according to this event */
  root?: ThreadItem;
  /** the parent event this is replying to */
  reply?: ThreadItem;
  /** refs from nostr event */
  refs: EventReferences;
  /** direct child replies */
  replies: ThreadItem[];
};

/** Returns an array of all pubkeys participating in the thread */
export function getThreadMembers(item: ThreadItem, omit?: string) {
  const pubkeys = new Set<string>();

  let i = item;
  while (true) {
    if (i.event.pubkey !== omit) pubkeys.add(i.event.pubkey);
    if (!i.reply) break;
    else i = i.reply;
  }

  return Array.from(pubkeys);
}

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
