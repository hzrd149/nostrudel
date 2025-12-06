import { COMMENT_KIND } from "applesauce-core/helpers";
import { getParsedContent } from "applesauce-content/text";
import { mapEventsToTimeline, withImmediateValueOrDefault } from "applesauce-core";
import { kinds, NostrEvent } from "nostr-tools";
import { filter, Observable, of, switchMap, throttleTime } from "rxjs";

import { shareAndHold } from "../../helpers/observable";
import accounts from "../accounts";
import { eventStore } from "../event-store";

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
