import { withImmediateValueOrDefault } from "applesauce-core";
import {
  COMMENT_KIND,
  getCoordinateFromAddressPointer,
  insertEventIntoDescendingList,
  isAddressPointer,
  isEventPointer,
} from "applesauce-core/helpers";
import { kinds, NostrEvent } from "nostr-tools";
import { combineLatest, Observable, of, scan, switchMap, throttleTime } from "rxjs";

import { shareAndHold } from "../../helpers/observable";
import accounts from "../accounts";
import { eventStore } from "../event-store";
import { userEvents$ } from "./common";
import { getReplyPointer } from "./threads";

/** Observable stream of direct reply notifications (replies directly to user's notes) */
export const replyNotifications$: Observable<NostrEvent[]> = accounts.active$.pipe(
  switchMap((account) => {
    if (!account) return of([]);

    // Create an observable for reply events
    const replyEvents$ = eventStore.filters({
      kinds: [kinds.ShortTextNote, COMMENT_KIND],
      "#p": [account.pubkey],
    });

    // Combine user note IDs with reply events
    return combineLatest([userEvents$, replyEvents$]).pipe(
      // Filter and accumulate only direct replies to user's notes
      scan((replies, [userEventIds, replyEvent]) => {
        // Skip user's own events
        if (replyEvent.pubkey === account.pubkey) return replies;

        // Check if event is already in the list
        if (replies.some((e) => e.id === replyEvent.id)) return replies;

        // Get the reply pointer to see what this event is replying to
        const replyPointer = getReplyPointer(replyEvent);
        if (!replyPointer) return replies;

        // Get the key for the reply pointer (either event ID or coordinate)
        let replyKey: string;

        if (isEventPointer(replyPointer)) {
          replyKey = replyPointer.id;
        } else if (isAddressPointer(replyPointer)) {
          replyKey = getCoordinateFromAddressPointer(replyPointer);
        } else {
          return replies;
        }

        // Check if the reply is to one of the user's notes
        if (!userEventIds.has(replyKey)) return replies;

        // Add to replies list and maintain descending order
        return insertEventIntoDescendingList(replies, replyEvent);
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
