import { TagValueLoader } from "applesauce-loaders";

import { WIKI_PAGE_KIND } from "../helpers/nostr/wiki";
import { eventStore } from "./event-store";
import { cacheRequest } from "./cache-relay";
import rxNostr from "./rx-nostr";

const wikiPageLoader = new TagValueLoader(rxNostr, "d", { name: "wiki-pages", kinds: [WIKI_PAGE_KIND], cacheRequest });

// start the loader and send all events to the event store
wikiPageLoader.subscribe((packet) => {
  eventStore.add(packet.event, packet.from);
});

export default wikiPageLoader;
