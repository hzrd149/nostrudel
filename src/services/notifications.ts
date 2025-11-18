import { COMMENT_KIND, getEventPointerFromQTag, insertEventIntoDescendingList } from "applesauce-core/helpers";
import { kinds, NostrEvent } from "nostr-tools";
import { combineLatest, filter, map, Observable, of, scan, shareReplay, switchMap, throttleTime } from "rxjs";

import { getParsedContent } from "applesauce-content/text";
import { mapEventsToTimeline, withImmediateValueOrDefault } from "applesauce-core";
import type { AddressPointer, EventPointer } from "applesauce-core/helpers";
import {
  getCoordinateFromAddressPointer,
  getSharedAddressPointer,
  getSharedEventPointer,
  getZapAddressPointer,
  getZapEventPointer,
  isValidZap,
  ZapEvent,
} from "applesauce-core/helpers";
import { TimelineLoader } from "applesauce-loaders/loaders";
import type { TZapGroup } from "../helpers/nostr/zaps";
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

/** Timeline loader for social notifications from the user's inboxes */
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
      );
  }),
  // Ensure observable has an immediate value
  withImmediateValueOrDefault([]),
  // Share the observable to avoid duplicate processing
  shareAndHold(),
  // Place throttle after share so each subscription gets its own
  throttleTime(1000 / 30, undefined, { leading: true, trailing: true }), // 30fps
);

/** Check if an event mentions the user's pubkey in its content */
function isMentionEvent(event: NostrEvent, userPubkey: string): boolean {
  // Parse content to get pointers
  const content = getParsedContent(event);

  return content.children.some(
    (c) =>
      c.type === "mention" &&
      // Is an npub mention
      ((c.decoded.type === "npub" && c.decoded.data === userPubkey) ||
        // Or an nprofile mention
        (c.decoded.type === "nprofile" && c.decoded.data.pubkey === userPubkey)),
  );
}

/** Check if an event is a quote (has "q" tag or content tag refs with "e" tag) */
export function isQuoteEvent(event: NostrEvent, pubkey: string): boolean {
  // Check if any of the "q" tags directly mention the user
  const quotes = event.tags.filter((t) => t[0] === "q" && t[1]).map(getEventPointerFromQTag);
  if (
    quotes.some(
      (q) =>
        // Pointer has pubkey and matches user
        q.author === pubkey ||
        // Or references a known event by the user
        eventStore.getEvent(q.id)?.pubkey === pubkey,
    )
  )
    return true;

  // Check content mentions
  const content = getParsedContent(event);
  if (
    content.children.some(
      (c) =>
        // Find nostr: mentions
        c.type === "mention" &&
        // If its a nevent with author
        ((c.decoded.type === "nevent" && c.decoded.data.author === pubkey) ||
          // Or an naddr with pubkey
          (c.decoded.type === "naddr" && c.decoded.data.pubkey === pubkey)),
    )
  )
    return true;

  return false;
}

/** Observable stream of quote notifications (events that mention the user in content AND are quotes) */
export const quoteNotifications$: Observable<NostrEvent[]> = accounts.active$.pipe(
  switchMap((account) => {
    if (!account) return of([]);

    // Use eventStore.filters to get a stream of both existing and new events
    return eventStore
      .filters({
        kinds: [kinds.ShortTextNote, kinds.LongFormArticle, COMMENT_KIND],
        "#p": [account.pubkey],
      })
      .pipe(
        // Ignore events created by the user
        filter((event) => event.pubkey !== account.pubkey),
        // Only include quote events
        filter((event) => isQuoteEvent(event, account.pubkey)),
        // Build timeline from events
        mapEventsToTimeline(),
      );
  }),
  // Ensure observable has an immediate value
  withImmediateValueOrDefault([]),
  // Share the observable to avoid duplicate processing
  shareAndHold(),
  // Place throttle after share so each subscription gets its own
  throttleTime(1000 / 30, undefined, { leading: true, trailing: true }), // 30fps
);

/** Observable stream of mention notifications (events that mention the user in content, excluding quotes) */
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
        // Ignore events created by the user
        filter((event) => event.pubkey !== account.pubkey),
        // Filter for events mentioning the user
        filter((event) => isMentionEvent(event, account.pubkey)),
        // Build timeline from events
        mapEventsToTimeline(),
      );
  }),
  // Ensure observable has an immediate value
  withImmediateValueOrDefault([]),
  // Share the observable to avoid duplicate processing
  shareAndHold(),
  // Place throttle after share so each subscription gets its own
  throttleTime(1000 / 30, undefined, { leading: true, trailing: true }), // 30fps
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
      );
  }),
  // Ensure observable has an immediate value
  withImmediateValueOrDefault([]),
  // Share the observable to avoid duplicate processing
  shareAndHold(),
  // Place throttle after share so each subscription gets its own
  throttleTime(1000 / 30, undefined, { leading: true, trailing: true }), // 30fps
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
      );
  }),
  // Ensure observable has an immediate value
  withImmediateValueOrDefault([]),
  // Share the observable to avoid duplicate processing
  shareAndHold(),
  // Place throttle after share so each subscription gets its own
  throttleTime(1000 / 30, undefined, { leading: true, trailing: true }), // 30fps
);
