import { kinds } from "nostr-tools";
import _throttle from "lodash.throttle";
import { AbstractRelay } from "nostr-tools/abstract-relay";

import SuperMap from "../classes/super-map";
import relayPoolService from "./relay-pool";
import BatchRelationLoader from "../classes/batch-relation-loader";
import { logger } from "../helpers/debug";
import { getCacheRelay } from "./cache-relay";

class EventZapsService {
  log = logger.extend("EventZapsService");

  private loaded = new Map<string, boolean>();
  loaders = new SuperMap<AbstractRelay, BatchRelationLoader>((relay) => {
    const loader = new BatchRelationLoader(relay, [kinds.Zap], this.log.extend(relay.url));
    return loader;
  });

  requestZaps(uid: string, urls: Iterable<string | URL | AbstractRelay>, alwaysRequest = true) {
    if (this.loaded.get(uid) && !alwaysRequest) return;

    const cacheRelay = getCacheRelay();
    if (cacheRelay) {
      this.loaders.get(cacheRelay as AbstractRelay).requestEvents(uid);
    }

    const relays = relayPoolService.getRelays(urls);
    for (const relay of relays) {
      this.loaders.get(relay).requestEvents(uid);
    }
  }
}

const eventZapsService = new EventZapsService();

if (import.meta.env.DEV) {
  // @ts-expect-error debug
  window.eventZapsService = eventZapsService;
}

export default eventZapsService;
