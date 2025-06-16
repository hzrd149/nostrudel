import { createTagValueLoader } from "applesauce-loaders/loaders";
import { WIKI_PAGE_KIND } from "../helpers/nostr/wiki";
import { cacheRequest } from "./cache-relay";
import pool from "./pool";

const wikiPageLoader = createTagValueLoader(pool, "d", {
  kinds: [WIKI_PAGE_KIND],
  cacheRequest,
});

export default wikiPageLoader;
