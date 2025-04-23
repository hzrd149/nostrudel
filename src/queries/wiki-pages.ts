import { Query } from "applesauce-core";
import { NostrEvent } from "nostr-tools";
import { WIKI_PAGE_KIND } from "../helpers/nostr/wiki";

export function WikiPagesQuery(topic: string): Query<NostrEvent[]> {
  return (store) => store.timeline([{ kinds: [WIKI_PAGE_KIND], "#d": [topic] }]);
}
