import {
  COMMENT_KIND,
  getEventPointerFromETag,
  getEventPointerFromQTag,
  getOrComputeCachedValue,
  getZapPayment,
  isETag,
  isPTag,
  mergeRelaySets,
  Mutes,
  processTags,
} from "applesauce-core/helpers";
import { getContentPointers } from "applesauce-factory/helpers";
import { kinds, nip18, nip25, NostrEvent } from "nostr-tools";
import {
  combineLatest,
  filter,
  map,
  Observable,
  ReplaySubject,
  share,
  switchMap,
  tap,
  throttleTime,
  timer,
} from "rxjs";

import { getThreadReferences, isReply, isRepost } from "../helpers/nostr/event";
import { TORRENT_COMMENT_KIND } from "../helpers/nostr/torrents";
import accounts from "./accounts";
import { eventStore } from "./event-store";
import localSettings from "./preferences";
import { MuteModel } from "applesauce-core/models";
import { eventLoader } from "./loaders";

export const NotificationTypeSymbol = Symbol("notificationType");

export enum NotificationType {
  Reply = "reply",
  Repost = "repost",
  Zap = "zap",
  Reaction = "reaction",
  Mention = "mention",
  Message = "message",
  Quote = "quote",
}
export type CategorizedEvent = NostrEvent & { [NotificationTypeSymbol]?: NotificationType };

function categorizeEvent(event: NostrEvent, pubkey?: string): CategorizedEvent {
  getOrComputeCachedValue(event, NotificationTypeSymbol, () => {
    if (event.kind === kinds.Zap) {
      return NotificationType.Zap;
    } else if (event.kind === kinds.Reaction) {
      return NotificationType.Reaction;
    } else if (isRepost(event)) {
      return NotificationType.Repost;
    } else if (event.kind === kinds.EncryptedDirectMessage) {
      return NotificationType.Message;
    } else if (
      event.kind === kinds.ShortTextNote ||
      event.kind === TORRENT_COMMENT_KIND ||
      event.kind === kinds.LiveChatMessage ||
      event.kind === kinds.LongFormArticle
    ) {
      // is the pubkey mentioned in any way in the content
      const isMentioned = pubkey
        ? getContentPointers(event.content).some(
            (p) =>
              // npub mention
              (p.type === "npub" && p.data === pubkey) ||
              // nprofile mention
              (p.type === "nprofile" && p.data.pubkey === pubkey),
          )
        : false;
      const isQuote =
        // NIP-18 quote
        event.tags.some((t) => t[0] === "q" && t[3] === pubkey) ||
        // NIP-10 mention
        (event.tags.some((t) => isETag(t) && t[3] === "mention") &&
          event.tags.some((t) => isPTag(t) && t[1] === pubkey && t[3] === "mention")) ||
        // NIP-19 nevent or note mention
        getContentPointers(event.content).some(
          (p) => (p.type === "nevent" && p.data.author === pubkey) || (p.type === "naddr" && p.data.pubkey === pubkey),
        );

      if (isMentioned) return NotificationType.Mention;
      else if (isQuote) return NotificationType.Quote;
      else if (isReply(event)) return NotificationType.Reply;

      return undefined;
    }
  });

  return event as CategorizedEvent;
}

function filterEvents(events: CategorizedEvent[], pubkey: string, mute?: Mutes): CategorizedEvent[] {
  return events.filter((event) => {
    // ignore if muted
    if (mute?.pubkeys.has(event.pubkey)) return false;

    // ignore if own
    if (event.pubkey === pubkey) return false;

    const e = event as CategorizedEvent;

    switch (e[NotificationTypeSymbol]) {
      case NotificationType.Reply:
        const refs = getThreadReferences(e);
        if (!refs.reply?.e?.id) return false;
        if (refs.reply?.e?.author && refs.reply?.e?.author !== pubkey) return false;
        const parent = eventStore.getEvent(refs.reply.e.id);
        if (parent?.pubkey !== pubkey) return false;
        break;
      case NotificationType.Mention:
        break;
      case NotificationType.Repost: {
        const pointer = nip18.getRepostedEventPointer(e);
        if (pointer?.author !== pubkey) return false;
        break;
      }
      case NotificationType.Reaction: {
        const pointer = nip25.getReactedEventPointer(e);
        if (!pointer) return false;
        if (pointer.author !== pubkey) return false;
        if (pointer.kind === kinds.EncryptedDirectMessage) return false;
        const parent = eventStore.getEvent(pointer.id);
        if (parent && parent.kind === kinds.EncryptedDirectMessage) return false;
        break;
      }
      case NotificationType.Zap:
        const p = getZapPayment(e);
        if (!p || p.amount === 0) return false;
        break;
    }

    return true;
  });
}

async function handleTextNote(event: NostrEvent) {
  // request quotes
  const quotes = processTags(event.tags, (t) => (t[0] === "q" ? t : undefined), getEventPointerFromQTag);
  for (const pointer of quotes) {
    eventLoader({
      id: pointer.id,
      relays: mergeRelaySets(localSettings.readRelays.value, pointer.relays),
    }).subscribe();
  }

  // request other event pointers
  const pointers = processTags(
    event.tags,
    (t) => (t[0] === "e" || t[0] === "E" ? t : undefined),
    getEventPointerFromETag,
  );
  for (const pointer of pointers) {
    eventLoader({
      id: pointer.id,
      relays: mergeRelaySets(localSettings.readRelays.value, pointer.relays),
    }).subscribe();
  }
}

async function handleShare(event: NostrEvent) {
  const pointers = processTags(event.tags, (t) => (t[0] === "e" ? t : undefined), getEventPointerFromETag);
  for (const pointer of pointers) {
    eventLoader({
      id: pointer.id,
      relays: mergeRelaySets(localSettings.readRelays.value, pointer.relays),
    }).subscribe();
  }
}

const notifications$: Observable<CategorizedEvent[]> = combineLatest([accounts.active$]).pipe(
  switchMap(([account]) => {
    if (!account) return [];

    const timeline$ = eventStore
      .timeline({
        "#p": [account.pubkey],
        kinds: [
          kinds.ShortTextNote,
          kinds.Repost,
          kinds.GenericRepost,
          kinds.Reaction,
          kinds.Zap,
          TORRENT_COMMENT_KIND,
          kinds.LongFormArticle,
          kinds.EncryptedDirectMessage,
          COMMENT_KIND,
        ],
      })
      .pipe(
        // filter out undefined
        filter((t) => t !== undefined),
        // update timeline at 30fps
        throttleTime(1000 / 30),
        // trigger logs of extra events
        tap((timeline) => {
          // handle loading dependencies of each event
          for (const event of timeline) {
            switch (event.kind) {
              case kinds.ShortTextNote:
                handleTextNote(event);
                break;
              case kinds.Report:
              case kinds.GenericRepost:
                handleShare(event);
                break;
            }
          }
        }),
        // categorize events
        map((timeline) => timeline.map((e) => categorizeEvent(e, account.pubkey))),
      );

    const mute$ = eventStore.model(MuteModel, account.pubkey);

    return combineLatest([timeline$, mute$]).pipe(
      // filter events out by mutes
      map(([timeline, mutes]) => filterEvents(timeline, account.pubkey, mutes)),
    );
  }),
  // keep the observable hot for 5 minutes after its unsubscribed
  share({ connector: () => new ReplaySubject(1), resetOnComplete: () => timer(5 * 60_000) }),
);

export default notifications$;
