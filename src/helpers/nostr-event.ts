import { isETag, isPTag, NostrEvent } from "../types/nostr-event";

export function isReply(event: NostrEvent) {
  return !!event.tags.find((tag) => isETag(tag) && tag[3] !== "mention");
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

  if (!rootId || !replyId) {
    // a direct reply dose not need a "reply" reference
    // https://github.com/nostr-protocol/nips/blob/master/10.md

    // this is not necessarily to spec. but if there is only one id (root or reply) then assign it to both
    // this handles the cases where a client only set a "reply" tag and no root
    rootId = replyId = rootId || replyId;
  }

  // legacy behavior
  // https://github.com/nostr-protocol/nips/blob/master/10.md#positional-e-tags-deprecated
  const legacyTags = eTags.filter((t) => !t[3]);
  if (!rootId && !replyId && legacyTags.length >= 1) {
    // console.info(`Using legacy threading behavior for ${event.id}`, event);

    // first tag is the root
    rootId = legacyTags[0][1];
    // last tag is reply
    replyId = legacyTags[legacyTags.length - 1][1] ?? rootId;
  }

  return {
    pubkeys,
    events,
    rootId,
    replyId,
  };
}
