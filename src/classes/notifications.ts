import { NostrEvent, kinds, nip18, nip25 } from "nostr-tools";
import _throttle from "lodash.throttle";
import { throttle, stateful, StatefulObservable } from "applesauce-core/observable";

import { getThreadReferences, isPTagMentionedInContent, isReply, isRepost } from "../helpers/nostr/event";
import { getParsedZap } from "../helpers/nostr/zaps";
import singleEventService from "../services/single-event";
import RelaySet from "./relay-set";
import clientRelaysService from "../services/client-relays";
import { getPubkeysMentionedInContent } from "../helpers/nostr/post";
import { TORRENT_COMMENT_KIND } from "../helpers/nostr/torrents";
import { STREAM_CHAT_MESSAGE_KIND } from "../helpers/nostr/stream";
import { MUTE_LIST_KIND, getPubkeysFromList } from "../helpers/nostr/lists";
import { eventStore, queryStore } from "../services/event-store";

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
  pubkey: string;

  // timeline = new PersistentSubject<CategorizedEvent[]>([]);
  timeline: StatefulObservable<CategorizedEvent[]>;

  constructor(pubkey: string) {
    this.pubkey = pubkey;

    this.timeline = stateful(
      throttle(
        queryStore.getTimeline([
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
            ],
          },
        ]),
        50,
      ).map((events) => events.map(this.handleEvent.bind(this)).filter(this.filterEvent.bind(this))),
    );
  }

  private categorizeEvent(event: NostrEvent): CategorizedEvent {
    const e = event as CategorizedEvent;

    if (e[typeSymbol]) return e;

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

    const loadEvent = (eventId: string, relays?: string[]) => {
      singleEventService.requestEvent(eventId, RelaySet.from(clientRelaysService.readRelays.value, relays));
    };

    switch (e[typeSymbol]) {
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
    if (!Object.hasOwn(event, typeSymbol)) return false;

    // ignore if muted
    // TODO: this should be moved somewhere more performant
    const muteList = eventStore.getReplaceable(MUTE_LIST_KIND, this.pubkey);
    const mutedPubkeys = muteList ? getPubkeysFromList(muteList).map((p) => p.pubkey) : [];
    if (mutedPubkeys.includes(event.pubkey)) return false;

    // ignore if own
    if (event.pubkey === this.pubkey) return false;

    const e = event as CategorizedEvent;

    switch (e[typeSymbol]) {
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
