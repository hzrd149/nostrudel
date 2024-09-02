import { NostrEvent } from "../types/nostr-event";
import { getNip10References, ThreadReferences } from "./nostr/threading";

export function countReplies(replies: ThreadItem[]): number {
  return replies.reduce((c, item) => c + countReplies(item.replies), 0) + replies.length;
}

export type ThreadItem = {
  /** underlying nostr event */
  event: NostrEvent;
  /** the thread root, according to this event */
  root?: ThreadItem;
  /** the parent event this is replying to */
  replyingTo?: ThreadItem;
  /** refs from nostr event */
  refs: ThreadReferences;
  /** direct child replies */
  replies: ThreadItem[];
};

/** Returns an array of all pubkeys participating in the thread */
export function getThreadMembers(item: ThreadItem, omit?: string) {
  const pubkeys = new Set<string>();

  let next = item;
  while (true) {
    if (next.event.pubkey !== omit) pubkeys.add(next.event.pubkey);
    if (!next.replyingTo) break;
    else next = next.replyingTo;
  }

  return Array.from(pubkeys);
}

export function buildThread(events: NostrEvent[]) {
  const idToChildren: Record<string, NostrEvent[]> = {};

  const replies = new Map<string, ThreadItem>();
  for (const event of events) {
    const refs = getNip10References(event);

    if (refs.reply?.e) {
      idToChildren[refs.reply.e.id] = idToChildren[refs.reply.e.id] || [];
      idToChildren[refs.reply.e.id].push(event);
    }

    replies.set(event.id, {
      event,
      refs,
      replies: [],
    });
  }

  for (const [id, reply] of replies) {
    reply.root = reply.refs.root?.e ? replies.get(reply.refs.root.e.id) : undefined;

    reply.replyingTo = reply.refs.reply?.e ? replies.get(reply.refs.reply.e.id) : undefined;

    reply.replies = idToChildren[id]?.map((e) => replies.get(e.id) as ThreadItem) ?? [];

    reply.replies.sort((a, b) => b.event.created_at - a.event.created_at);
  }

  return replies;
}
