import { EventTemplate, NostrEvent } from "nostr-tools";
import { AddressPointer, EventPointer } from "nostr-tools/nip19";

import { ATag, ETag, isATag, isETag } from "../../types/nostr-event";
import { aTagToAddressPointer, eTagToEventPointer, getContentTagRefs } from "./event";

export function interpretThreadTags(event: NostrEvent | EventTemplate) {
  const eTags = event.tags.filter(isETag);
  const aTags = event.tags.filter(isATag);

  // find the root and reply tags.
  let rootETag = eTags.find((t) => t[3] === "root");
  let replyETag = eTags.find((t) => t[3] === "reply");

  let rootATag = aTags.find((t) => t[3] === "root");
  let replyATag = aTags.find((t) => t[3] === "reply");

  if (!rootETag || !replyETag) {
    // a direct reply does not need a "reply" reference
    // https://github.com/nostr-protocol/nips/blob/master/10.md

    // this is not necessarily to spec. but if there is only one id (root or reply) then assign it to both
    // this handles the cases where a client only set a "reply" tag and no root
    rootETag = replyETag = rootETag || replyETag;
  }
  if (!rootATag || !replyATag) {
    rootATag = replyATag = rootATag || replyATag;
  }

  if (!rootETag && !replyETag) {
    const contentTagRefs = getContentTagRefs(event.content, eTags);

    // legacy behavior
    // https://github.com/nostr-protocol/nips/blob/master/10.md#positional-e-tags-deprecated
    const legacyETags = eTags.filter((t) => {
      // ignore it if there is a type
      if (t[3]) return false;
      if (contentTagRefs.includes(t)) return false;
      return true;
    });

    if (legacyETags.length >= 1) {
      // first tag is the root
      rootETag = legacyETags[0];
      // last tag is reply
      replyETag = legacyETags[legacyETags.length - 1] ?? rootETag;
    }
  }

  return {
    root: rootETag || rootATag ? { e: rootETag, a: rootATag } : undefined,
    reply: replyETag || replyATag ? { e: replyETag, a: replyATag } : undefined,
  } as {
    root?: { e: ETag; a: undefined } | { e: undefined; a: ATag } | { e: ETag; a: ATag };
    reply?: { e: ETag; a: undefined } | { e: undefined; a: ATag } | { e: ETag; a: ATag };
  };
}

export type ThreadReferences = {
  root?:
    | { e: EventPointer; a: undefined }
    | { e: undefined; a: AddressPointer }
    | { e: EventPointer; a: AddressPointer };
  reply?:
    | { e: EventPointer; a: undefined }
    | { e: undefined; a: AddressPointer }
    | { e: EventPointer; a: AddressPointer };
};
export const threadRefsSymbol = Symbol("threadRefs");
export type EventWithThread = (NostrEvent | EventTemplate) & { [threadRefsSymbol]: ThreadReferences };

export function getNip10References(event: NostrEvent | EventTemplate): ThreadReferences {
  // @ts-expect-error
  if (Object.hasOwn(event, threadRefsSymbol)) return event[threadRefsSymbol];

  const e = event as EventWithThread;
  const tags = interpretThreadTags(e);

  const threadRef = {
    root: tags.root && {
      e: tags.root.e && eTagToEventPointer(tags.root.e),
      a: tags.root.a && aTagToAddressPointer(tags.root.a),
    },
    reply: tags.reply && {
      e: tags.reply.e && eTagToEventPointer(tags.reply.e),
      a: tags.reply.a && aTagToAddressPointer(tags.reply.a),
    },
  } as ThreadReferences;

  // @ts-expect-error
  event[threadRefsSymbol] = threadRef;

  return threadRef;
}
