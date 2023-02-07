import { NostrEvent } from "../types/nostr-event";
import { EventReferences, getReferences } from "./nostr-event";

export type LinkedEvent = {
  event: NostrEvent;
  root?: LinkedEvent;
  reply?: LinkedEvent;
  refs: EventReferences;
  children: LinkedEvent[];
};

export function linkEvents(events: NostrEvent[]) {
  const idToChildren: Record<string, NostrEvent[]> = {};

  const replies = new Map<string, LinkedEvent>();
  for (const event of events) {
    const refs = getReferences(event);

    if (refs.replyId) {
      idToChildren[refs.replyId] = idToChildren[refs.replyId] || [];
      idToChildren[refs.replyId].push(event);
    }
    if (refs.rootId) {
      idToChildren[refs.rootId] = idToChildren[refs.rootId] || [];
      idToChildren[refs.rootId].push(event);
    }

    replies.set(event.id, {
      event,
      refs,
      children: [],
    });
  }

  for (const [id, reply] of replies) {
    reply.root = reply.refs.rootId ? replies.get(reply.refs.rootId) : undefined;

    reply.reply = reply.refs.replyId ? replies.get(reply.refs.replyId) : undefined;

    reply.children = idToChildren[id]?.map((e) => replies.get(e.id) as LinkedEvent) ?? [];
  }

  return replies;
}
