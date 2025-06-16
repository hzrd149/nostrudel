import { Model } from "applesauce-core";
import { NostrEvent } from "nostr-tools";
import { map } from "rxjs";

import { getReplaceableIdentifier } from "applesauce-core/helpers";
import { WIKI_PAGE_KIND } from "../helpers/nostr/wiki";

export function WikiTopicsModel(): Model<Record<string, NostrEvent[]>> {
  return (events) =>
    events.timeline([{ kinds: [WIKI_PAGE_KIND] }]).pipe(
      map((events) => {
        const topics: Record<string, NostrEvent[]> = {};

        for (const event of events) {
          const d = getReplaceableIdentifier(event);
          if (!d) continue;

          if (!topics[d]) topics[d] = [event];
          else topics[d].push(event);
        }

        return topics;
      }),
    );
}
