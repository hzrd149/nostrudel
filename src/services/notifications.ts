import {
  COMMENT_KIND,
  getEventPointerFromETag,
  getEventPointerFromQTag,
  getZapPayment,
  Mutes,
  processTags,
} from "applesauce-core/helpers";
import { combineLatest, filter, map, mergeMap, Observable, share, tap } from "rxjs";
import { TimelineQuery, UserMuteQuery } from "applesauce-core/queries";
import { kinds, nip18, nip25, NostrEvent } from "nostr-tools";

import localSettings from "./local-settings";
import singleEventLoader from "./single-event-loader";
import { eventStore, queryStore } from "./event-store";
import { TORRENT_COMMENT_KIND } from "../helpers/nostr/torrents";
import accounts from "./accounts";
import { getThreadReferences, isReply, isRepost } from "../helpers/nostr/event";
import { getPubkeysMentionedInContent } from "../helpers/nostr/post";
import { getContentPointers } from "applesauce-factory/helpers";

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
  const e = event as CategorizedEvent;

  if (e[NotificationTypeSymbol]) return e;

  if (event.kind === kinds.Zap) {
    e[NotificationTypeSymbol] = NotificationType.Zap;
  } else if (event.kind === kinds.Reaction) {
    e[NotificationTypeSymbol] = NotificationType.Reaction;
  } else if (isRepost(event)) {
    e[NotificationTypeSymbol] = NotificationType.Repost;
  } else if (event.kind === kinds.EncryptedDirectMessage) {
    e[NotificationTypeSymbol] = NotificationType.Message;
  } else if (
    event.kind === kinds.ShortTextNote ||
    event.kind === TORRENT_COMMENT_KIND ||
    event.kind === kinds.LiveChatMessage ||
    event.kind === kinds.LongFormArticle
  ) {
    // is the pubkey mentioned in any way in the content
    const isMentioned = pubkey ? getPubkeysMentionedInContent(event.content, true).includes(pubkey) : false;
    const isQuote =
      event.tags.some((t) => t[0] === "q" && (t[1] === event.id || t[3] === pubkey)) ||
      getContentPointers(event.content).some(
        (p) => (p.type === "nevent" && p.data.id === event.id) || (p.type === "note" && p.data === event.id),
      );

    if (isMentioned) e[NotificationTypeSymbol] = NotificationType.Mention;
    else if (isQuote) e[NotificationTypeSymbol] = NotificationType.Quote;
    else if (isReply(event)) e[NotificationTypeSymbol] = NotificationType.Reply;
  }
  return e;
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
    singleEventLoader.next({
      id: pointer.id,
      relays: [...localSettings.readRelays.value, ...(pointer.relays ?? [])],
    });
  }

  // request other event pointers
  const pointers = processTags(
    event.tags,
    (t) => (t[0] === "e" || t[0] === "E" ? t : undefined),
    getEventPointerFromETag,
  );
  for (const pointer of pointers) {
    singleEventLoader.next({
      id: pointer.id,
      relays: [...localSettings.readRelays.value, ...(pointer.relays ?? [])],
    });
  }
}

async function handleShare(event: NostrEvent) {
  const pointers = processTags(event.tags, (t) => (t[0] === "e" ? t : undefined), getEventPointerFromETag);
  for (const pointer of pointers) {
    singleEventLoader.next({
      id: pointer.id,
      relays: [...localSettings.readRelays.value, ...(pointer.relays ?? [])],
    });
  }
}

const notifications$: Observable<CategorizedEvent[]> = combineLatest([accounts.active$]).pipe(
  mergeMap(([account]) => {
    if (!account) return [];

    const timeline$ = queryStore
      .createQuery(TimelineQuery, {
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
        filter(t => t!== undefined),
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
        map((timeline) => timeline.map((e) => categorizeEvent(e, account.pubkey))),
      );

    const mute$ = queryStore.createQuery(UserMuteQuery, account.pubkey);

    return combineLatest([timeline$, mute$]).pipe(
      map(([timeline, mutes]) => filterEvents(timeline, account.pubkey, mutes)),
    );
  }),
  share(),
);

export default notifications$;
