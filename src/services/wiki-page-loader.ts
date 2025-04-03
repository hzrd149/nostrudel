import { TagValueLoader } from "applesauce-loaders";

import { WIKI_PAGE_KIND } from "../helpers/nostr/wiki";
import { eventStore } from "./event-store";
import { cacheRequest } from "./cache-relay";
import { nostrRequest } from "./rx-nostr";

const wikiPageLoader = new TagValueLoader(nostrRequest, "d", {
  name: "wiki-pages",
  kinds: [WIKI_PAGE_KIND],
  cacheRequest,
});

// start the loader and send all events to the event store
wikiPageLoader.subscribe((event) => eventStore.add(event));

export default wikiPageLoader;
