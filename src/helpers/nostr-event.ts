import { isETag, isPTag, NostrEvent } from "../types/nostr-event";

export function isReply(event: NostrEvent) {
  return !!event.tags.find(isETag);
}

export function isPost(event: NostrEvent) {
  return !isReply(event);
}

export function truncatedId(id: string) {
  return id.substring(0, 6) + "..." + id.substring(id.length - 6);
}

export type EventReferences = ReturnType<typeof getReferences>;
export function getReferences(event: NostrEvent) {
  const eTags = event.tags.filter(isETag);
  const pTags = event.tags.filter(isPTag);

  const events = eTags.map((t) => t[1]);
  const pubkeys = pTags.map((t) => t[1]);

  let replyId = eTags.find((t) => t[3] === "reply")?.[1];
  let rootId = eTags.find((t) => t[3] === "root")?.[1];

  if (rootId && !replyId) {
    // a direct reply dose not need a "reply" reference
    // https://github.com/nostr-protocol/nips/blob/master/10.md
    replyId = rootId;
  }

  // legacy behavior
  // https://github.com/nostr-protocol/nips/blob/master/10.md#positional-e-tags-deprecated
  if (!rootId && !replyId && eTags.length >= 1) {
    console.warn(`Using legacy threading behavior for ${event.id}`, event);

    // first tag is the root
    rootId = eTags[0][1];
    // last tag is reply
    replyId = eTags[eTags.length - 1][1] ?? rootId;
  }

  return {
    pubkeys,
    events,
    rootId,
    replyId,
  };
}
