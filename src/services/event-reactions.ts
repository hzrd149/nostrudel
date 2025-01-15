import { kinds } from "nostr-tools";
import _throttle from "lodash.throttle";
import { AbstractRelay } from "nostr-tools/abstract-relay";

import SuperMap from "../classes/super-map";
import relayPoolService from "./relay-pool";
import Process from "../classes/process";
import { LightningIcon } from "../components/icons";
import processManager from "./process-manager";
import BatchRelationLoader from "../classes/batch-relation-loader";
import { logger } from "../helpers/debug";
import { getCacheRelay } from "./cache-relay";

class EventReactionsService {
  log = logger.extend("EventReactionsService");
  process: Process;

  private loaded = new Map<string, boolean>();
  loaders = new SuperMap<AbstractRelay, BatchRelationLoader>((relay) => {
    const loader = new BatchRelationLoader(relay, [kinds.Reaction], this.log.extend(relay.url));
    this.process.addChild(loader.process);
    return loader;
  });

  constructor() {
    this.process = new Process("EventReactionsService", this);
    this.process.icon = LightningIcon;
    this.process.active = true;

    processManager.registerProcess(this.process);
  }

  requestReactions(uid: string, urls: Iterable<string | URL | AbstractRelay>, alwaysRequest = false) {
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

const eventReactionsService = new EventReactionsService();

if (import.meta.env.DEV) {
  // @ts-expect-error debug
  window.eventReactionsService = eventReactionsService;
}

export default eventReactionsService;
