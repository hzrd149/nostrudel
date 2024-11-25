import { getTagValue } from "applesauce-core/helpers";
import { NostrEvent, isATag } from "../../types/nostr-event";

export function getPackCordsFromFavorites(event: NostrEvent) {
  return event.tags.filter(isATag).map((t) => t[1]);
}
