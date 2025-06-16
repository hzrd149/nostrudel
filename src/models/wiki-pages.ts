import { Model } from "applesauce-core";
import { NostrEvent } from "nostr-tools";
import { WIKI_PAGE_KIND } from "../helpers/nostr/wiki";

export function WikiPagesModel(topic: string): Model<NostrEvent[]> {
  return (events) => events.timeline([{ kinds: [WIKI_PAGE_KIND], "#d": [topic] }]);
}
