import { isATag } from "applesauce-core/helpers";
import { NostrEvent } from "nostr-tools";

export function getPackCordsFromFavorites(event: NostrEvent) {
  return event.tags.filter(isATag).map((t) => t[1]);
}
