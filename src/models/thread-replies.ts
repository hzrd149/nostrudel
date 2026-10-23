import { RepliesModel } from "applesauce-common/models";
import { Model } from "applesauce-core";
import { NostrEvent } from "nostr-tools";
import { map } from "rxjs";

import { castThreadEvent, ThreadEvent } from "../helpers/nostr/thread";

/** Keep protocol-specific relationship parsing in applesauce, then cast the mixed timeline. */
export function ThreadRepliesModel(event: NostrEvent): Model<ThreadEvent[]> {
  return (store) =>
    store.model(RepliesModel, event).pipe(
      map((replies) =>
        replies.flatMap((reply) => {
          const cast = castThreadEvent(reply);
          return cast ? [cast] : [];
        }),
      ),
    );
}
