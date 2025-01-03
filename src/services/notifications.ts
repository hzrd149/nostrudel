import { getEventPointerFromETag, getEventPointerFromQTag, processTags } from "applesauce-core/helpers";
import { TimelineQuery } from "applesauce-core/queries";
import { kinds, NostrEvent } from "nostr-tools";

import singleEventService from "./single-event";
import clientRelaysService from "./client-relays";
import { combineLatest, filter, from, map, mergeMap, shareReplay, tap } from "rxjs";
import accountService from "./account";
import { queryStore } from "./event-store";
import { TORRENT_COMMENT_KIND } from "../helpers/nostr/torrents";

async function handleTextNote(event: NostrEvent) {
  // request quotes
  const quotes = processTags(event.tags, (t) => (t[0] === "q" ? t : undefined), getEventPointerFromQTag);
  for (const pointer of quotes) {
    singleEventService.requestEvent(pointer.id, [...clientRelaysService.readRelays.value, ...(pointer.relays ?? [])]);
  }

  // request other event pointers
  const pointers = processTags(
    event.tags,
    (t) => (t[0] === "e" || t[0] === "E" ? t : undefined),
    getEventPointerFromETag,
  );
  for (const pointer of pointers) {
    singleEventService.requestEvent(pointer.id, [...clientRelaysService.readRelays.value, ...(pointer.relays ?? [])]);
  }
}

async function handleShare(event: NostrEvent) {
  const pointers = processTags(event.tags, (t) => (t[0] === "e" ? t : undefined), getEventPointerFromETag);
  for (const pointer of pointers) {
    singleEventService.requestEvent(pointer.id, [...clientRelaysService.readRelays.value, ...(pointer.relays ?? [])]);
  }
}

const notifications = combineLatest([accountService.current]).pipe(
  mergeMap(([account]) => {
    if (account)
      return queryStore.createQuery(TimelineQuery, {
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
          1111, //NIP-22
        ],
      });
    else return [];
  }),
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
);
