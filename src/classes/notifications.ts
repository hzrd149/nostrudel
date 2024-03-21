import { NostrEvent, kinds, nip18, nip25 } from "nostr-tools";
import _throttle from "lodash.throttle";

import EventStore from "./event-store";
import { PersistentSubject } from "./subject";
import { getThreadReferences, isPTagMentionedInContent, isReply, isRepost } from "../helpers/nostr/event";
import { getParsedZap } from "../helpers/nostr/zaps";
import singleEventService from "../services/single-event";
import RelaySet from "./relay-set";
import clientRelaysService from "../services/client-relays";
import { getPubkeysMentionedInContent } from "../helpers/nostr/post";
import { TORRENT_COMMENT_KIND } from "../helpers/nostr/torrents";
import { STREAM_CHAT_MESSAGE_KIND } from "../helpers/nostr/stream";

export const typeSymbol = Symbol("notificationType");

export enum NotificationType {
  Reply = "reply",
  Repost = "repost",
  Zap = "zap",
  Reaction = "reaction",
  Mention = "mention",
}
export type CategorizedEvent = NostrEvent & { [typeSymbol]?: NotificationType };

export default class AccountNotifications {
  store: EventStore;
  pubkey: string;
  private subs: ZenObservable.Subscription[] = [];

  timeline = new PersistentSubject<CategorizedEvent[]>([]);

  constructor(pubkey: string, store: EventStore) {
    this.store = store;
    this.pubkey = pubkey;

    this.subs.push(store.onEvent.subscribe(this.handleEvent.bind(this)));

    for (const [_, event] of store.events) this.handleEvent(event);
  }

  private categorizeEvent(event: NostrEvent): CategorizedEvent {
    const e = event as CategorizedEvent;
    if (event.kind === kinds.Zap) {
      e[typeSymbol] = NotificationType.Zap;
    } else if (event.kind === kinds.Reaction) {
      e[typeSymbol] = NotificationType.Reaction;
    } else if (isRepost(event)) {
      e[typeSymbol] = NotificationType.Repost;
    } else if (
      event.kind === kinds.ShortTextNote ||
      event.kind === TORRENT_COMMENT_KIND ||
      event.kind === STREAM_CHAT_MESSAGE_KIND ||
      event.kind === kinds.LongFormArticle
    ) {
      // is the "p" tag directly mentioned in the content
      const isMentioned = isPTagMentionedInContent(event, this.pubkey);
      // is the pubkey mentioned in any way in the content
      const isQuoted = getPubkeysMentionedInContent(event.content).includes(this.pubkey);

      if (isMentioned || isQuoted) e[typeSymbol] = NotificationType.Mention;
      else if (isReply(event)) e[typeSymbol] = NotificationType.Reply;
    }
    return e;
  }

  handleEvent(event: NostrEvent) {
    const e = this.categorizeEvent(event);

    const getAndSubscribe = (eventId: string, relays?: string[]) => {
      const subject = singleEventService.requestEvent(
        eventId,
        RelaySet.from(clientRelaysService.readRelays.value, relays),
      );

      subject.once(this.throttleUpdateTimeline);
      return subject.value;
    };

    switch (e[typeSymbol]) {
      case NotificationType.Reply:
        const refs = getThreadReferences(e);
        if (refs.reply?.e?.id) getAndSubscribe(refs.reply.e.id, refs.reply.e.relays);
        break;
      case NotificationType.Reaction: {
        const pointer = nip25.getReactedEventPointer(e);
        if (pointer?.id) getAndSubscribe(pointer.id, pointer.relays);
        break;
      }
    }
  }

  throttleUpdateTimeline = _throttle(this.updateTimeline.bind(this), 200);
  updateTimeline() {
    const sorted = this.store.getSortedEvents();

    const timeline: CategorizedEvent[] = [];
    for (const event of sorted) {
      if (!Object.hasOwn(event, typeSymbol)) continue;
      const e = event as CategorizedEvent;

      switch (e[typeSymbol]) {
        case NotificationType.Reply:
          const refs = getThreadReferences(e);
          if (!refs.reply?.e?.id) break;
          if (refs.reply?.e?.author && refs.reply?.e?.author !== this.pubkey) break;
          const parent = singleEventService.getSubject(refs.reply.e.id).value;
          if (!parent || parent.pubkey !== this.pubkey) break;
          timeline.push(e);
          break;
        case NotificationType.Mention:
          timeline.push(e);
          break;
        case NotificationType.Repost: {
          const pointer = nip18.getRepostedEventPointer(e);
          if (pointer?.author !== this.pubkey) break;
          timeline.push(e);
          break;
        }
        case NotificationType.Reaction: {
          const pointer = nip25.getReactedEventPointer(e);
          if (!pointer) break;
          if (pointer.author !== this.pubkey) break;
          if (pointer.kind === kinds.EncryptedDirectMessage) break;
          const parent = singleEventService.getSubject(pointer.id).value;
          if (parent && parent.kind === kinds.EncryptedDirectMessage) break;
          timeline.push(e);
          break;
        }
        case NotificationType.Zap:
          const parsed = getParsedZap(e);
          if (parsed instanceof Error) break;
          if (!parsed.payment.amount) break;
          timeline.push(e);
          break;
      }
    }
    this.timeline.next(timeline);
  }

  destroy() {
    for (const sub of this.subs) sub.unsubscribe();
    this.subs = [];
  }
}
