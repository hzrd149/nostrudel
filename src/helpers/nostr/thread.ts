import { castEvent, Comment, Note } from "applesauce-common/casts";
import {
  COMMENT_KIND,
  CommentPointer,
  getCommentReplyPointer,
  getCommentRootPointer,
  getNip10References,
  isValidComment,
} from "applesauce-common/helpers";
import {
  AddressPointer,
  EventPointer,
  eventMatchesPointer,
  getAddressPointerForEvent,
  getReplaceableAddressFromPointer,
  isAddressPointer,
} from "applesauce-core/helpers";
import { Filter, kinds, NostrEvent } from "nostr-tools";

export type ThreadEvent = Note | Comment;
export type ThreadScope = EventPointer | AddressPointer | Extract<CommentPointer, { type: "external" }>;

export function isExternalThreadScope(scope: ThreadScope): scope is Extract<CommentPointer, { type: "external" }> {
  return "type" in scope && scope.type === "external";
}

/** Convert NIP-22 relay/author hints to the pointers understood by store loaders. */
function commentScope(pointer: CommentPointer): ThreadScope {
  if (pointer.type === "external") return pointer;
  const relays = pointer.relay ? [pointer.relay] : undefined;
  if (pointer.type === "address") {
    return { kind: pointer.kind, pubkey: pointer.pubkey, identifier: pointer.identifier, relays };
  }
  return { id: pointer.id, kind: pointer.kind, author: pointer.pubkey, relays };
}

export function getThreadRoot(event: NostrEvent): ThreadScope {
  if (event.kind === COMMENT_KIND) {
    const root = getCommentRootPointer(event);
    return root ? commentScope(root) : { id: event.id };
  }
  if (event.kind === kinds.ShortTextNote) {
    const root = getNip10References(event).root;
    if (root) return root.a ?? root.e;
  }
  return getAddressPointerForEvent(event) ?? { id: event.id };
}

export function getThreadParent(event: NostrEvent): ThreadScope | undefined {
  if (event.kind === COMMENT_KIND) {
    const parent = getCommentReplyPointer(event);
    return parent ? commentScope(parent) : undefined;
  }
  if (event.kind === kinds.ShortTextNote) {
    const reply = getNip10References(event).reply;
    return reply?.a ?? reply?.e;
  }
  return undefined;
}

export function getThreadScopeKey(scope: ThreadScope): string {
  if (isExternalThreadScope(scope)) return `${scope.kind}:${scope.identifier}`;
  return isAddressPointer(scope) ? getReplaceableAddressFromPointer(scope) : scope.id;
}

/** Root scope tags load all depths; direct-parent checks belong to RepliesModel. */
export function getThreadFilters(scope: ThreadScope): Filter[] {
  if (isExternalThreadScope(scope)) return [{ kinds: [COMMENT_KIND], "#I": [scope.identifier] }];
  if (isAddressPointer(scope)) {
    return [{ kinds: [COMMENT_KIND], "#A": [getReplaceableAddressFromPointer(scope)] }];
  }
  return [
    { kinds: [kinds.ShortTextNote], "#e": [scope.id] },
    { kinds: [COMMENT_KIND], "#E": [scope.id] },
    { kinds: [kinds.ShortTextNote, COMMENT_KIND], "#q": [scope.id] },
  ];
}

export function castThreadEvent(event: NostrEvent): ThreadEvent | undefined {
  if (event.kind === kinds.ShortTextNote) return castEvent(event, Note);
  if (isValidComment(event)) return castEvent(event, Comment);
  return undefined;
}

export function isDirectThreadReply(reply: NostrEvent, parent: NostrEvent | string): boolean {
  const pointer = getThreadParent(reply);
  if (!pointer || isExternalThreadScope(pointer)) return false;
  if (typeof parent === "string") return !isAddressPointer(pointer) && pointer.id === parent;
  return eventMatchesPointer(parent, pointer);
}
