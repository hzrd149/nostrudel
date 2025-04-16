import { Query } from "applesauce-core";
import { map } from "rxjs";
import { NostrEvent } from "nostr-tools";

import { WIKI_PAGE_KIND } from "../helpers/nostr/wiki";
import { getReplaceableIdentifier } from "applesauce-core/helpers";

export function WikiTopicsQuery(): Query<Record<string, NostrEvent[]>> {
  return {
    key: "topics",
    run: (store) =>
      store.timeline([{ kinds: [WIKI_PAGE_KIND] }]).pipe(
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
      ),
  };
}
