import { Query } from "applesauce-core";
import { NostrEvent } from "nostr-tools";
import { scan } from "rxjs/operators";

export default function DVMResponsesQuery(request: NostrEvent): Query<Record<string, NostrEvent>> {
  return {
    key: request.id,
    run: (events) =>
      events.filters([{ kinds: [request.kind + 1000, 7000], "#e": [request.id] }]).pipe(
        scan(
          (byPubkey, event) => {
            if (byPubkey[event.pubkey] && byPubkey[event.pubkey].created_at > event.created_at) return byPubkey;

            return { ...byPubkey, [event.pubkey]: event };
          },
          {} as Record<string, NostrEvent>,
        ),
      ),
  };
}
