import { Model } from "applesauce-core";
import { NostrEvent } from "nostr-tools";
import { scan } from "rxjs/operators";

export function DVMResponsesModel(request: NostrEvent): Model<Record<string, NostrEvent>> {
  return (events) =>
    events.filters([{ kinds: [request.kind + 1000, 7000], "#e": [request.id] }]).pipe(
      scan(
        (byPubkey, event) => {
          if (byPubkey[event.pubkey] && byPubkey[event.pubkey].created_at > event.created_at) return byPubkey;

          return { ...byPubkey, [event.pubkey]: event };
        },
        {} as Record<string, NostrEvent>,
      ),
    );
}
