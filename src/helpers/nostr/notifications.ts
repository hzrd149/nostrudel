import {
  COMMENT_KIND,
  getCommentReplyPointer,
  getCommentRootPointer,
  getNip10References,
  matchMutes,
  MutedThings,
} from "applesauce-common/helpers";
import { getParsedContent } from "applesauce-content/text";
import {
  AddressPointer,
  EventPointer,
  getEventPointerFromQTag,
  getSeenRelays,
  getReplaceableAddressFromPointer,
  isEventPointer,
  relaySet,
} from "applesauce-core/helpers";
import { kinds, NostrEvent } from "nostr-tools";

export const SOCIAL_NOTIFICATION_KINDS = [kinds.ShortTextNote, kinds.LongFormArticle, COMMENT_KIND];

export type ThreadGroupData = {
  key: string;
  rootPointer: EventPointer | AddressPointer;
  replies: NostrEvent[];
  repliers: string[];
  latest: number;
};

export type ThreadNotification = { type: "thread"; data: ThreadGroupData; timestamp: number };
export type SocialNotifications = {
  replies: NostrEvent[];
  mentions: NostrEvent[];
  quotes: NostrEvent[];
  threads: ThreadNotification[];
};

function getCommentPointer(event: NostrEvent, root: boolean): EventPointer | AddressPointer | undefined {
  const pointer = root ? getCommentRootPointer(event) : getCommentReplyPointer(event);
  if (pointer?.type === "event")
    return { id: pointer.id, author: pointer.pubkey, relays: pointer.relay ? [pointer.relay] : [] };
  if (pointer?.type === "address")
    return {
      kind: pointer.kind,
      pubkey: pointer.pubkey,
      identifier: pointer.identifier,
      relays: pointer.relay ? [pointer.relay] : [],
    };
  return undefined;
}

export function getReplyPointer(event: NostrEvent): EventPointer | AddressPointer | undefined {
  if (event.kind === COMMENT_KIND) return getCommentPointer(event, false);
  const refs = getNip10References(event);
  return refs.reply?.e ?? refs.reply?.a;
}

export function getThreadRoot(event: NostrEvent): EventPointer | AddressPointer | undefined {
  if (event.kind === COMMENT_KIND) return getCommentPointer(event, true);
  const refs = getNip10References(event);
  return refs.root?.e ?? refs.root?.a ?? refs.reply?.e ?? refs.reply?.a;
}

export function getThreadRootKey(pointer: EventPointer | AddressPointer | undefined): string | undefined {
  if (!pointer) return undefined;
  return isEventPointer(pointer) ? `e:${pointer.id}` : `a:${getReplaceableAddressFromPointer(pointer)}`;
}

export function isMutedNotification(event: NostrEvent, user: string, mutes: MutedThings | undefined): boolean {
  return event.pubkey !== user && !!mutes && matchMutes(mutes, event);
}

export function isMentionEvent(event: NostrEvent, user: string): boolean {
  return getParsedContent(event).children.some(
    (node) =>
      node.type === "mention" &&
      ((node.decoded.type === "npub" && node.decoded.data === user) ||
        (node.decoded.type === "nprofile" && node.decoded.data.pubkey === user)),
  );
}

export function getQuotePointers(event: NostrEvent): EventPointer[] {
  return event.tags
    .filter((tag) => tag[0] === "q" && tag[1])
    .map(getEventPointerFromQTag)
    .filter((pointer): pointer is EventPointer => pointer !== null);
}

export function isQuoteEvent(
  event: NostrEvent,
  user: string,
  getEvent: (id: string) => NostrEvent | undefined,
): boolean {
  if (getQuotePointers(event).some((pointer) => (getEvent(pointer.id)?.pubkey ?? pointer.author) === user)) return true;
  return getParsedContent(event).children.some(
    (node) =>
      node.type === "mention" &&
      ((node.decoded.type === "nevent" && node.decoded.data.author === user) ||
        (node.decoded.type === "naddr" && node.decoded.data.pubkey === user)),
  );
}

/** Event references whose author must be resolved to classify replies and quotes. */
export function getNotificationParentPointers(event: NostrEvent): EventPointer[] {
  const reply = getReplyPointer(event);
  return [...(reply && isEventPointer(reply) ? [reply] : []), ...getQuotePointers(event)]
    .filter((pointer) => !pointer.author)
    .map((pointer) => ({ ...pointer, relays: relaySet(pointer.relays, [...(getSeenRelays(event) ?? [])]) }));
}

export function getSocialNotifications(events: NostrEvent[], user: string, mutes?: MutedThings): SocialNotifications {
  const result: SocialNotifications = { replies: [], mentions: [], quotes: [], threads: [] };
  const byId = new Map(events.map((event) => [event.id, event]));
  const groups = new Map<string, ThreadGroupData>();
  for (const event of events) {
    if (
      event.pubkey === user ||
      !SOCIAL_NOTIFICATION_KINDS.includes(event.kind) ||
      !event.tags.some((tag) => tag[0] === "p" && tag[1] === user) ||
      isMutedNotification(event, user, mutes)
    )
      continue;
    const pointer = getReplyPointer(event);
    const author =
      pointer && (isEventPointer(pointer) ? (byId.get(pointer.id)?.pubkey ?? pointer.author) : pointer.pubkey);
    if (author === user && (event.kind === kinds.ShortTextNote || event.kind === COMMENT_KIND))
      result.replies.push(event);
    if (isMentionEvent(event, user)) result.mentions.push(event);
    if (isQuoteEvent(event, user, (id) => byId.get(id))) result.quotes.push(event);
    const root = getThreadRoot(event);
    const key = getThreadRootKey(root);
    if (!root || !key || (event.kind !== kinds.ShortTextNote && event.kind !== COMMENT_KIND)) continue;
    let group = groups.get(key);
    if (!group) {
      group = { key, rootPointer: root, replies: [], repliers: [], latest: event.created_at };
      groups.set(key, group);
    }
    group.replies.push(event);
  }
  result.threads = [...groups.values()].map((data) => ({
    type: "thread",
    data: { ...data, repliers: [...new Set(data.replies.map((event) => event.pubkey))] },
    timestamp: data.latest,
  }));
  return result;
}
