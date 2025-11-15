import {
  COMMENT_KIND,
  getNip10References,
  getCommentReplyPointer,
  getCommentRootPointer,
  insertEventIntoDescendingList,
} from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";
import { EventPointer, AddressPointer } from "nostr-tools/nip19";
import { eventStore } from "../../../services/event-store";

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

// Types for the notification state
export type DirectReplyData = {
  key: string;
  event: NostrEvent;
  parentPointer?: EventPointer | AddressPointer;
};

export type ThreadGroupData = {
  key: string;
  rootPointer: EventPointer | AddressPointer;
  replies: NostrEvent[];
  repliers: string[];
  latest: number;
};

export type ThreadNotificationState = {
  directReplies: Map<string, DirectReplyData>;
  threadGroups: Map<string, ThreadGroupData>;
};

/**
 * Iteratively process a single event and update the notification state.
 * This function can be used with RxJS scan operator for incremental updates.
 */
export function processThreadNotification(
  state: ThreadNotificationState,
  event: NostrEvent,
  userPubkey: string,
): ThreadNotificationState {
  // Skip user's own events
  if (event.pubkey === userPubkey) return state;

  const replyPointer = getReplyPointer(event);
  const threadRoot = getThreadRoot(event);

  // Try to determine if this is a direct reply
  let isDirect = false;
  if (replyPointer) {
    // Check if reply pointer matches any of user's posts
    if ("id" in replyPointer) {
      const parentPost = eventStore.getEvent(replyPointer.id);
      isDirect = isDirectReplyTo(event, userPubkey, parentPost);
    }
  }

  if (isDirect && replyPointer) {
    // Add as direct reply
    const key = `direct-${event.id}`;

    // Only add if not already present
    if (!state.directReplies.has(key)) {
      const newDirectReplies = new Map(state.directReplies);
      newDirectReplies.set(key, {
        key,
        event,
        parentPointer: replyPointer,
      });

      return {
        ...state,
        directReplies: newDirectReplies,
      };
    }
  } else if (threadRoot) {
    // Add to thread group
    const rootKey = getThreadRootKey(threadRoot);
    if (rootKey) {
      const existingGroup = state.threadGroups.get(rootKey);

      // Check if event is already in the group
      if (existingGroup && existingGroup.replies.some((e) => e.id === event.id)) {
        return state;
      }

      const newThreadGroups = new Map(state.threadGroups);

      if (existingGroup) {
        // Update existing group
        const newReplies = [...existingGroup.replies];
        insertEventIntoDescendingList(newReplies, event);

        const newRepliers = existingGroup.repliers.includes(event.pubkey)
          ? existingGroup.repliers
          : [...existingGroup.repliers, event.pubkey];

        newThreadGroups.set(rootKey, {
          key: rootKey,
          rootPointer: existingGroup.rootPointer,
          replies: newReplies,
          repliers: newRepliers,
          latest: Math.max(existingGroup.latest, event.created_at),
        });
      } else {
        // Create new group
        newThreadGroups.set(rootKey, {
          key: rootKey,
          rootPointer: threadRoot,
          replies: [event],
          repliers: [event.pubkey],
          latest: event.created_at,
        });
      }

      return {
        ...state,
        threadGroups: newThreadGroups,
      };
    }
  }

  return state;
}

export type ThreadNotification =
  | { type: "direct"; data: DirectReplyData; timestamp: number }
  | { type: "thread"; data: ThreadGroupData; timestamp: number };

/**
 * Convert the notification state into a sorted array of notifications
 */
export function getNotificationsFromState(state: ThreadNotificationState) {
  const notifications: ThreadNotification[] = [];

  // Add direct replies
  for (const reply of state.directReplies.values()) {
    notifications.push({
      type: "direct",
      data: reply,
      timestamp: reply.event.created_at,
    });
  }

  // Add thread groups
  for (const group of state.threadGroups.values()) {
    notifications.push({
      type: "thread",
      data: group,
      timestamp: group.latest,
    });
  }

  // Sort by timestamp (newest first)
  notifications.sort((a, b) => b.timestamp - a.timestamp);

  return notifications;
}
