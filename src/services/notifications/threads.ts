import { withImmediateValueOrDefault } from "applesauce-core";
import {
  AddressPointer,
  COMMENT_KIND,
  EventPointer,
  getCommentReplyPointer,
  getCommentRootPointer,
  getCoordinateFromAddressPointer,
  getNip10References,
  insertEventIntoDescendingList,
  isAddressPointer,
  isEventPointer,
  NostrEvent,
} from "applesauce-core/helpers";
import { kinds } from "nostr-tools";
import { map, Observable, of, scan, switchMap, throttleTime } from "rxjs";

import { shareAndHold } from "../../helpers/observable";
import { getNotificationsFromState, ThreadNotification } from "../../views/notifications/threads/helpers";
import accounts from "../accounts";
import { eventStore } from "../event-store";
import { userEvents$ } from "./common";

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

/**
 * Check if a reply pointer is a direct reply to one of the user's events
 */
function isDirectReply(replyPointer: EventPointer | AddressPointer, userEventIds: Set<string>): boolean {
  let replyKey: string;

  if (isEventPointer(replyPointer)) {
    replyKey = replyPointer.id;
  } else if (isAddressPointer(replyPointer)) {
    replyKey = getCoordinateFromAddressPointer(replyPointer);
  } else {
    return false;
  }

  return userEventIds.has(replyKey);
}

// Types for the notification state
export type ThreadGroupData = {
  key: string;
  rootPointer: EventPointer | AddressPointer;
  replies: NostrEvent[];
  repliers: string[];
  latest: number;
};

export type ThreadNotificationState = {
  threadGroups: Map<string, ThreadGroupData>;
};

/**
 * Iteratively process a single event and update the notification state.
 * This function can be used with RxJS scan operator for incremental updates.
 * Note: Direct replies should be filtered out before calling this function.
 */
export function processThreadNotification(state: ThreadNotificationState, event: NostrEvent): ThreadNotificationState {
  const threadRoot = getThreadRoot(event);

  // Add to thread group if we have a thread root
  if (threadRoot) {
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

/** Observable stream of processed thread notifications (only thread groups, excluding direct replies) */
export const threadNotifications$: Observable<ThreadNotification[]> = accounts.active$.pipe(
  switchMap((account) => {
    if (!account) return of([]);

    // Initial state
    const initialState: ThreadNotificationState = {
      threadGroups: new Map(),
    };

    // Get reply events
    const replyEvents$ = eventStore.filters({
      kinds: [kinds.ShortTextNote, COMMENT_KIND],
      "#p": [account.pubkey],
    });

    // Use switchMap on userEvents$ to reset state when user events change
    return userEvents$.pipe(
      switchMap((userEventIds) =>
        replyEvents$.pipe(
          scan((state, event) => {
            // Skip user's own events
            if (event.pubkey === account.pubkey) return state;

            // Get the reply pointer to check if it's a direct reply
            const replyPointer = getReplyPointer(event);

            // If this is a direct reply to user's event, skip it
            if (replyPointer && isDirectReply(replyPointer, userEventIds)) return state;

            // Skip user's own events
            if (event.pubkey === account.pubkey) return state;

            // Process as thread notification
            return processThreadNotification(state, event);
          }, initialState),
        ),
      ),
      // Convert state to sorted notifications array
      map(getNotificationsFromState),
    );
  }),
  // Ensure observable has an immediate value
  withImmediateValueOrDefault([]),
  // Share the observable to avoid duplicate processing
  shareAndHold(),
  // Place throttle after share so each subscription gets its own
  throttleTime(1000 / 30, undefined, { leading: true, trailing: true }), // 30fps
);
