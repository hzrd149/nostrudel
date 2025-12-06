import { COMMENT_KIND, getEventPointerFromQTag } from "applesauce-core/helpers";
import { getParsedContent } from "applesauce-content/text";
import { mapEventsToTimeline, withImmediateValueOrDefault } from "applesauce-core";
import { kinds, NostrEvent } from "nostr-tools";
import { filter, Observable, of, switchMap, throttleTime } from "rxjs";

import { shareAndHold } from "../../helpers/observable";
import accounts from "../accounts";
import { eventStore } from "../event-store";

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
