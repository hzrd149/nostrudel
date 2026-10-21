import { Model } from "applesauce-core";
import { kinds, NostrEvent } from "nostr-tools";

/** Short text notes that quote an event with a `q` tag */
export function QuotesModel(id: string): Model<NostrEvent[]> {
  return (events) => events.timeline({ kinds: [kinds.ShortTextNote], "#q": [id] });
}
