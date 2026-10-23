import { RepliesModel } from "applesauce-common/models";
import { Model } from "applesauce-core";
import { NostrEvent } from "nostr-tools";
import { map } from "rxjs";

import { countDescendantsInTimeline } from "../helpers/nostr/descendant-count";
import { castThreadEvent, getThreadFilters, getThreadRoot, ThreadEvent } from "../helpers/nostr/thread";

/** Keep protocol-specific relationship parsing in applesauce, then cast the mixed timeline. */
export function ThreadRepliesModel(event: NostrEvent): Model<ThreadEvent[]> {
  return (store) =>
    store.model(RepliesModel, event).pipe(
      map((replies) =>
        replies.flatMap((reply) => {
          if (reply.id === event.id) return [];
          const cast = castThreadEvent(reply);
          return cast ? [cast] : [];
        }),
      ),
    );
}

/** Refresh counts when any loaded descendant changes, including replies below collapsed posts. */
export function ThreadDescendantCountModel(event: NostrEvent): Model<number> {
  return (store) =>
    store
      .timeline(getThreadFilters(getThreadRoot(event)))
      .pipe(map((events) => countDescendantsInTimeline(event, events)));
}
