import { NostrEvent } from "nostr-tools";
import { AbstractRelay } from "nostr-tools/abstract-relay";
import _throttle from "lodash.throttle";
import { EventStore } from "applesauce-core";
import { isFromCache } from "applesauce-core/helpers";

import SuperMap from "../classes/super-map";
import BatchKindPubkeyLoader, { createCoordinate } from "../classes/batch-kind-pubkey-loader";
import Process from "../classes/process";
import { logger } from "../helpers/debug";
import { localRelay } from "./local-relay";
import relayPoolService from "./relay-pool";
import { alwaysVerify } from "./verify-event";
import { truncateId } from "../helpers/string";
import processManager from "./process-manager";
import UserSquare from "../components/icons/user-square";
import { eventStore } from "./event-store";

export type RequestOptions = {
  /** Always request the event from the relays */
  alwaysRequest?: boolean;
  /** ignore the cache on initial load */
  ignoreCache?: boolean;
};

export function getHumanReadableCoordinate(kind: number, pubkey: string, d?: string) {
  return `${kind}:${truncateId(pubkey)}${d ? ":" + d : ""}`;
}

class ReplaceableEventsService {
  store: EventStore;
  process: Process;

  cacheLoader: BatchKindPubkeyLoader | null = null;
  loaders = new SuperMap<AbstractRelay, BatchKindPubkeyLoader>((relay) => {
    const loader = new BatchKindPubkeyLoader(this.store, relay, this.log.extend(relay.url));
    this.process.addChild(loader.process);
    return loader;
  });

  log = logger.extend("ReplaceableEventLoader");

  constructor(store: EventStore) {
    this.store = store;
    this.process = new Process("ReplaceableEventsService", this);
    this.process.icon = UserSquare;
    this.process.active = true;
    processManager.registerProcess(this.process);

    if (localRelay) {
      this.cacheLoader = new BatchKindPubkeyLoader(
        this.store,
        localRelay as AbstractRelay,
        this.log.extend("cache-relay"),
      );
      this.process.addChild(this.cacheLoader.process);
    }
  }

  handleEvent(event: NostrEvent, fromCache = false) {
    // TODO: move this to the cache relay class
    if (!fromCache && !alwaysVerify(event)) return;

    event = this.store.add(event);
    if (!isFromCache(event)) localRelay?.publish(event);
  }

  /** @deprecated use eventStore.getReplaceable instead */
  getEvent(kind: number, pubkey: string, d?: string) {
    return eventStore.getReplaceable(kind, pubkey, d);
  }

  private requestEventFromRelays(
    urls: Iterable<string | URL | AbstractRelay>,
    kind: number,
    pubkey: string,
    d?: string,
  ) {
    const cord = createCoordinate(kind, pubkey, d);
    const relays = relayPoolService.getRelays(urls);

    for (const relay of relays) this.loaders.get(relay).requestEvent(kind, pubkey, d);
  }

  requestEvent(
    urls: Iterable<string | URL | AbstractRelay>,
    kind: number,
    pubkey: string,
    d?: string,
    opts: RequestOptions = {},
  ) {
    const relays = relayPoolService.getRelays(urls);

    const existing = eventStore.getReplaceable(kind, pubkey, d);

    if (!existing && this.cacheLoader) {
      this.cacheLoader.requestEvent(kind, pubkey, d).then((loaded) => {
        if (!loaded && !eventStore.hasReplaceable(kind, pubkey, d)) {
          this.requestEventFromRelays(relays, kind, pubkey, d);
        }
      });
    }

    if (opts?.alwaysRequest || !this.cacheLoader || (!existing && opts.ignoreCache)) {
      this.requestEventFromRelays(relays, kind, pubkey, d);
    }
  }

  destroy() {
    processManager.unregisterProcess(this.process);
  }
}

const replaceableEventsService = new ReplaceableEventsService(eventStore);

if (import.meta.env.DEV) {
  //@ts-expect-error debug
  window.replaceableEventsService = replaceableEventsService;
}

export default replaceableEventsService;
