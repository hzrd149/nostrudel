import {
  COMMENT_KIND,
  getNip10References,
  getCommentReplyPointer,
  getCommentRootPointer,
} from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import { EventPointer, AddressPointer } from "nostr-tools/nip19";

/**
 * Get the thread root pointer from an event
 * For kind 1: Use NIP-10 root or fall back to reply
 * For kind 1111 (comments): Use comment root pointer
 */
export function getThreadRoot(event: NostrEvent): EventPointer | AddressPointer | undefined {
  if (event.kind === COMMENT_KIND) {
    const rootPointer = getCommentRootPointer(event);
    if (!rootPointer) return;
    if (rootPointer.type === "event" || rootPointer.type === "address") return rootPointer;
    else return;
  } else {
    // For kind 1 and other events, use NIP-10
    const refs = getNip10References(event);
    return refs.root?.e || refs.root?.a || refs.reply?.e || refs.reply?.a;
  }
}

/**
 * Get the reply pointer from an event (what this event is directly replying to)
 * For kind 1: Use NIP-10 reply
 * For kind 1111 (comments): Use comment reply pointer
 */
export function getReplyPointer(event: NostrEvent): EventPointer | AddressPointer | undefined {
  if (event.kind === COMMENT_KIND) {
    const pointer = getCommentReplyPointer(event);
    if (!pointer) return;
    if (pointer.type === "event" || pointer.type === "address") return pointer;
    else return;
  } else {
    // For kind 1 and other events, use NIP-10
    const refs = getNip10References(event);
    return refs.reply?.e || refs.reply?.a;
  }
}

/**
 * Check if an event pointer matches an event
 */
export function pointerMatchesEvent(
  pointer: EventPointer | AddressPointer | undefined,
  event: NostrEvent | undefined,
): boolean {
  if (!pointer || !event) return false;

  // Check EventPointer
  if ("id" in pointer) {
    return pointer.id === event.id;
  }

  // Check AddressPointer
  if ("kind" in pointer && "pubkey" in pointer) {
    const dTag = event.tags.find((t) => t[0] === "d")?.[1] || "";
    return pointer.kind === event.kind && pointer.pubkey === event.pubkey && pointer.identifier === dTag;
  }

  return false;
}

/**
 * Check if an event is a direct reply to a specific user's post
 * Returns true if the event is replying to a post authored by the given pubkey
 * Returns false if we can't determine (treats as thread reply by default)
 */
export function isDirectReplyTo(event: NostrEvent, userPubkey: string, parentEvent?: NostrEvent): boolean {
  const replyPointer = getReplyPointer(event);

  // If we have the parent event, check if it's authored by the user
  if (parentEvent) {
    return pointerMatchesEvent(replyPointer, parentEvent) && parentEvent.pubkey === userPubkey;
  }

  // If we don't have the parent event, we can't determine
  // Default to false (treat as thread reply)
  return false;
}

/**
 * Get a unique key for a thread root pointer
 */
export function getThreadRootKey(pointer: EventPointer | AddressPointer | undefined): string | undefined {
  if (!pointer) return undefined;

  if ("id" in pointer) {
    return `e:${pointer.id}`;
  }

  if ("kind" in pointer && "pubkey" in pointer) {
    return `a:${pointer.kind}:${pointer.pubkey}:${pointer.identifier || ""}`;
  }

  return undefined;
}
