import { NostrEvent, kinds, nip18, nip25 } from "nostr-tools";
import _throttle from "lodash.throttle";
import { BehaviorSubject } from "rxjs";
import { map, throttleTime } from "rxjs/operators";

import { getThreadReferences, isReply, isRepost } from "../helpers/nostr/event";
import { getParsedZap } from "../helpers/nostr/zaps";
import singleEventService from "../services/single-event";
import RelaySet from "./relay-set";
import clientRelaysService from "../services/client-relays";
import { getPubkeysMentionedInContent } from "../helpers/nostr/post";
import { TORRENT_COMMENT_KIND } from "../helpers/nostr/torrents";
import { MUTE_LIST_KIND, getPubkeysFromList } from "../helpers/nostr/lists";
import { eventStore, queryStore } from "../services/event-store";

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

export default class AccountNotifications {
  pubkey: string;

  timeline = new BehaviorSubject<CategorizedEvent[]>([]);

  constructor(pubkey: string) {
    this.pubkey = pubkey;

    // subscribe to query store
    queryStore
      .timeline([
        {
          "#p": [pubkey],
          kinds: [
            kinds.ShortTextNote,
            kinds.Repost,
            kinds.GenericRepost,
            kinds.Reaction,
            kinds.Zap,
            TORRENT_COMMENT_KIND,
            kinds.LongFormArticle,
            kinds.EncryptedDirectMessage,
            1111, //NIP-22
          ],
        },
      ])
      .pipe(
        throttleTime(100),
        map((events) => events.map(this.handleEvent.bind(this)).filter(this.filterEvent.bind(this))),
      )
      .subscribe((events) => this.timeline.next(events));
  }

  private categorizeEvent(event: NostrEvent): CategorizedEvent {
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
      const isMentioned = getPubkeysMentionedInContent(event.content, true).includes(this.pubkey);
      const isQuote = event.tags.some((t) => t[0] === "q" && t[3] === this.pubkey);

      if (isMentioned) e[NotificationTypeSymbol] = NotificationType.Mention;
      else if (isQuote) e[NotificationTypeSymbol] = NotificationType.Quote;
      else if (isReply(event)) e[NotificationTypeSymbol] = NotificationType.Reply;
    }
    return e;
  }

  handleEvent(event: NostrEvent) {
    const e = this.categorizeEvent(event);

    const loadEvent = (eventId: string, relays?: string[]) => {
      singleEventService.requestEvent(eventId, RelaySet.from(clientRelaysService.readRelays.value, relays));
    };

    // load event quotes
    const quotes = event.tags.filter((t) => t[0] === "q" && t[1]);
    for (const tag of quotes) {
      loadEvent(tag[1], tag[2] ? [tag[2]] : undefined);
    }

    // load reactions and replies
    switch (e[NotificationTypeSymbol]) {
      case NotificationType.Reply:
        const refs = getThreadReferences(e);
        if (refs.reply?.e?.id) loadEvent(refs.reply.e.id, refs.reply.e.relays);
        break;
      case NotificationType.Reaction: {
        const pointer = nip25.getReactedEventPointer(e);
        if (pointer?.id) loadEvent(pointer.id, pointer.relays);
        break;
      }
    }

    return e;
  }

  private filterEvent(event: CategorizedEvent) {
    // ignore if muted
    // TODO: this should be moved somewhere more performant
    const muteList = eventStore.getReplaceable(MUTE_LIST_KIND, this.pubkey);
    const mutedPubkeys = muteList ? getPubkeysFromList(muteList).map((p) => p.pubkey) : [];
    if (mutedPubkeys.includes(event.pubkey)) return false;

    // ignore if own
    if (event.pubkey === this.pubkey) return false;

    const e = event as CategorizedEvent;

    switch (e[NotificationTypeSymbol]) {
      case NotificationType.Reply:
        const refs = getThreadReferences(e);
        if (!refs.reply?.e?.id) return false;
        if (refs.reply?.e?.author && refs.reply?.e?.author !== this.pubkey) return false;
        const parent = eventStore.getEvent(refs.reply.e.id);
        if (!parent || parent.pubkey !== this.pubkey) return false;
        break;
      case NotificationType.Mention:
        break;
      case NotificationType.Repost: {
        const pointer = nip18.getRepostedEventPointer(e);
        if (pointer?.author !== this.pubkey) return false;
        break;
      }
      case NotificationType.Reaction: {
        const pointer = nip25.getReactedEventPointer(e);
        if (!pointer) return false;
        if (pointer.author !== this.pubkey) return false;
        if (pointer.kind === kinds.EncryptedDirectMessage) return false;
        const parent = eventStore.getEvent(pointer.id);
        if (parent && parent.kind === kinds.EncryptedDirectMessage) return false;
        break;
      }
      case NotificationType.Zap:
        const parsed = getParsedZap(e, true, true);
        if (parsed instanceof Error) return false;
        if (!parsed.payment.amount) return false;
        break;
    }

    return true;
  }
}
