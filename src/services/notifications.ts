import { COMMENT_KIND, insertEventIntoDescendingList } from "applesauce-core/helpers";
import { kinds, NostrEvent } from "nostr-tools";
import { combineLatest, filter, map, Observable, of, scan, shareReplay, switchMap, throttleTime } from "rxjs";

import { TimelineLoader } from "applesauce-loaders/loaders";
import { shareAndHold } from "../helpers/observable";
import {
  getNotificationsFromState,
  processThreadNotification,
  ThreadNotification,
  ThreadNotificationState,
} from "../views/notifications/threads/helpers";
import accounts from "./accounts";
import { eventStore } from "./event-store";
import localSettings from "./preferences";
import timelineCacheService from "./timeline-cache";
import { withImmediateValueOrDefault } from "applesauce-core";
import { getContentPointers } from "applesauce-factory/helpers";
import {
  getZapAddressPointer,
  getZapEventPointer,
  getCoordinateFromAddressPointer,
  isValidZap,
  ZapEvent,
} from "applesauce-core/helpers";
import type { TZapGroup } from "../helpers/nostr/zaps";
import type { AddressPointer, EventPointer } from "applesauce-core/helpers";
import { getSharedAddressPointer, getSharedEventPointer } from "applesauce-core/helpers";

export type TRepostGroup = {
  key: string;
  eventPointer: EventPointer;
  addressPointer: AddressPointer | undefined;
  events: NostrEvent[];
  latest: number;
};

// Get users mailboxes
const mailboxes$ = accounts.active$.pipe(
  switchMap((account) => (account ? eventStore.mailboxes(account.pubkey) : of(null))),
);

// Get users inboxes or fallback relays
const inboxes$ = combineLatest([mailboxes$, localSettings.fallbackRelays]).pipe(
  map(([mailboxes, fallbackRelays]) => mailboxes?.inboxes ?? fallbackRelays),
);

/** Timeline loader for share notifications from the user's inboxes */
export const shareNotificationsLoader$: Observable<TimelineLoader | null> = combineLatest([
  accounts.active$,
  inboxes$,
]).pipe(
  map(([account, inboxes]) => {
    if (!account || inboxes.length === 0) return null;

    return timelineCacheService.createTimeline(`shares-notifications-${account.pubkey}`, inboxes, [
      {
        "#p": [account.pubkey],
        kinds: [kinds.Repost, kinds.GenericRepost],
      },
    ]);
  }),
  // Only create a single timeline
  shareReplay(1),
);

/** Timeline loader for social notificatiots from the user's inboxes */
export const socialNotificationsLoader$: Observable<TimelineLoader | null> = combineLatest([
  accounts.active$,
  inboxes$,
]).pipe(
  map(([account, inboxes]) => {
    if (!account || inboxes.length === 0) return null;

    return timelineCacheService.createTimeline(`notifications-${account.pubkey}`, inboxes, [
      {
        "#p": [account.pubkey],
        kinds: [kinds.ShortTextNote, kinds.LongFormArticle, COMMENT_KIND],
      },
      // Also load the users own timeline from their inboxes so that replies to their own notes are shown
      { authors: [account.pubkey], kinds: [kinds.ShortTextNote, kinds.LongFormArticle, COMMENT_KIND] },
    ]);
  }),
  // Only create a single timeline
  shareReplay(1),
);

/** Timeline loader for zap notifications from the user's inboxes */
export const zapNotificationsLoader$: Observable<TimelineLoader | null> = combineLatest([
  accounts.active$,
  inboxes$,
]).pipe(
  map(([account, inboxes]) => {
    if (!account || inboxes.length === 0) return null;

    return timelineCacheService.createTimeline(`zaps-notifications-${account.pubkey}`, inboxes, [
      {
        "#p": [account.pubkey],
        kinds: [kinds.Zap],
      },
    ]);
  }),
  // Only create a single timeline
  shareReplay(1),
);

/** Observable stream of processed thread notifications (direct replies and thread groups) */
export const threadNotifications$: Observable<ThreadNotification[]> = accounts.active$.pipe(
  switchMap((account) => {
    if (!account) return of([]);

    // Initial state
    const initialState: ThreadNotificationState = {
      directReplies: new Map(),
      threadGroups: new Map(),
    };

    // Use eventStore.filters to get a stream of both existing and new events
    return eventStore
      .filters({
        kinds: [kinds.ShortTextNote, COMMENT_KIND],
        "#p": [account.pubkey],
      })
      .pipe(
        // Use scan to incrementally build state from each event
        scan((state, event) => processThreadNotification(state, event, account.pubkey), initialState),
        // Convert state to sorted notifications array
        map(getNotificationsFromState),
        // Throttle updates to avoid excessive re-renders
        throttleTime(500, undefined, { leading: true, trailing: true }),
      );
  }),
  // Ensure observable has an immediate value
  withImmediateValueOrDefault([]),
  // Share the observable to avoid duplicate processing
  shareAndHold(),
);

/**
 * Check if an event mentions the user's pubkey in its content
 */
function isMentionEvent(event: NostrEvent, userPubkey: string): boolean {
  const pointers = getContentPointers(event.content);
  return pointers.some(
    (p) =>
      // npub mention
      (p.type === "npub" && p.data === userPubkey) ||
      // nprofile mention
      (p.type === "nprofile" && p.data.pubkey === userPubkey),
  );
}

/** Observable stream of mention notifications (events that mention the user in content) */
export const mentionNotifications$: Observable<NostrEvent[]> = accounts.active$.pipe(
  switchMap((account) => {
    if (!account) return of([]);

    // Use eventStore.filters to get a stream of both existing and new events
    return eventStore
      .filters({
        kinds: [kinds.ShortTextNote, kinds.LongFormArticle, COMMENT_KIND],
        "#p": [account.pubkey],
      })
      .pipe(
        // Use scan to build a sorted list of mention events
        scan((mentions, event) => {
          // Check if event mentions the user
          if (!isMentionEvent(event, account.pubkey)) return mentions;

          // Check if event is already in the list
          if (mentions.some((e) => e.id === event.id)) return mentions;

          // Add event and maintain descending order by created_at
          return insertEventIntoDescendingList(mentions, event);
        }, [] as NostrEvent[]),
        // Throttle updates to avoid excessive re-renders
        throttleTime(500, undefined, { leading: true, trailing: true }),
      );
  }),
  // Ensure observable has an immediate value
  withImmediateValueOrDefault([]),
  // Share the observable to avoid duplicate processing
  shareAndHold(),
);

/**
 * Process a zap event and update the zap groups state
 */
function processZapNotification(groups: Map<string, TZapGroup>, event: ZapEvent): Map<string, TZapGroup> {
  // Try to get the zapped event pointer
  const eventPointer = getZapEventPointer(event) ?? undefined;
  const addressPointer = getZapAddressPointer(event) ?? undefined;

  const key = addressPointer ? getCoordinateFromAddressPointer(addressPointer) : eventPointer?.id;
  if (!key) return groups;

  // Create a new Map to maintain immutability
  const newGroups = new Map(groups);

  // Get or create the group
  const existingGroup = newGroups.get(key);
  if (!existingGroup) {
    const group: TZapGroup = {
      key,
      eventPointer: eventPointer!,
      addressPointer: addressPointer,
      events: [event],
      latest: event.created_at,
    };
    newGroups.set(key, group);
  } else {
    // Check if event is already in the group
    if (existingGroup.events.some((e) => e.id === event.id)) return groups;

    // Create a new group object with updated events
    const group: TZapGroup = {
      ...existingGroup,
      events: insertEventIntoDescendingList([...existingGroup.events], event) as ZapEvent[],
      latest: Math.max(existingGroup.latest, event.created_at),
    };
    newGroups.set(key, group);
  }

  return newGroups;
}

/**
 * Convert zap groups Map to sorted array
 */
function getZapGroupsFromState(groups: Map<string, TZapGroup>): TZapGroup[] {
  return Array.from(groups.values()).sort((a, b) => b.latest - a.latest);
}

/** Observable stream of grouped zap notifications */
export const zapNotifications$: Observable<TZapGroup[]> = accounts.active$.pipe(
  switchMap((account) => {
    if (!account) return of([]);

    // Use eventStore.filters to get a stream of both existing and new zap events
    return eventStore
      .filters({
        kinds: [kinds.Zap],
        "#p": [account.pubkey],
      })
      .pipe(
        filter((event): event is ZapEvent => {
          // TODO: remove when isValidZap does not throw
          try {
            return isValidZap(event);
          } catch (error) {
            return false;
          }
        }),
        // Use scan to incrementally build zap groups from each event
        scan((groups, event) => processZapNotification(groups, event), new Map<string, TZapGroup>()),
        // Convert Map to sorted array
        map(getZapGroupsFromState),
        // Throttle updates to avoid excessive re-renders
        throttleTime(500, undefined, { leading: true, trailing: true }),
      );
  }),
  // Ensure observable has an immediate value
  withImmediateValueOrDefault([]),
  // Share the observable to avoid duplicate processing
  shareAndHold(),
);

/**
 * Process a repost event and update the repost groups state
 */
function processRepostNotification(groups: Map<string, TRepostGroup>, event: NostrEvent): Map<string, TRepostGroup> {
  // Try to get the shared event pointer
  const addressPointer = getSharedAddressPointer(event) ?? undefined;
  const eventPointer = getSharedEventPointer(event) ?? undefined;

  const key = addressPointer ? getCoordinateFromAddressPointer(addressPointer) : eventPointer?.id;
  if (!key) return groups;

  // Create a new Map to maintain immutability
  const newGroups = new Map(groups);

  // Get or create the group
  const existingGroup = newGroups.get(key);
  if (!existingGroup) {
    const group: TRepostGroup = {
      key,
      eventPointer: eventPointer!,
      addressPointer: addressPointer,
      events: [event],
      latest: event.created_at,
    };
    newGroups.set(key, group);
  } else {
    // Check if event is already in the group
    if (existingGroup.events.some((e) => e.id === event.id)) return groups;

    // Create a new group object with updated events
    const group: TRepostGroup = {
      ...existingGroup,
      events: insertEventIntoDescendingList([...existingGroup.events], event),
      latest: Math.max(existingGroup.latest, event.created_at),
    };
    newGroups.set(key, group);
  }

  return newGroups;
}

/**
 * Convert repost groups Map to sorted array
 */
function getRepostGroupsFromState(groups: Map<string, TRepostGroup>): TRepostGroup[] {
  return Array.from(groups.values()).sort((a, b) => b.latest - a.latest);
}

/** Observable stream of grouped repost notifications */
export const repostNotifications$: Observable<TRepostGroup[]> = accounts.active$.pipe(
  switchMap((account) => {
    if (!account) return of([]);

    // Use eventStore.filters to get a stream of both existing and new repost events
    return eventStore
      .filters({
        kinds: [kinds.Repost, kinds.GenericRepost],
        "#p": [account.pubkey],
      })
      .pipe(
        // Use scan to incrementally build repost groups from each event
        scan((groups, event) => processRepostNotification(groups, event), new Map<string, TRepostGroup>()),
        // Convert Map to sorted array
        map(getRepostGroupsFromState),
        // Throttle updates to avoid excessive re-renders
        throttleTime(500, undefined, { leading: true, trailing: true }),
      );
  }),
  // Ensure observable has an immediate value
  withImmediateValueOrDefault([]),
  // Share the observable to avoid duplicate processing
  shareAndHold(),
);
