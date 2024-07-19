import { AbstractRelay, NostrEvent } from "nostr-tools";
import _throttle from "lodash.throttle";

import SuperMap from "../classes/super-map";
import EventStore from "../classes/event-store";
import Subject from "../classes/subject";
import BatchKindPubkeyLoader, { createCoordinate } from "../classes/batch-kind-pubkey-loader";
import Process from "../classes/process";
import { logger } from "../helpers/debug";
import { getEventCoordinate } from "../helpers/nostr/event";
import { localRelay } from "./local-relay";
import relayPoolService from "./relay-pool";
import { alwaysVerify } from "./verify-event";
import { truncateId } from "../helpers/string";
import processManager from "./process-manager";
import UserSquare from "../components/icons/user-square";

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
  process: Process;

  private subjects = new SuperMap<string, Subject<NostrEvent>>(() => new Subject<NostrEvent>());

  cacheLoader: BatchKindPubkeyLoader | null = null;
  loaders = new SuperMap<AbstractRelay, BatchKindPubkeyLoader>((relay) => {
    const loader = new BatchKindPubkeyLoader(relay, this.log.extend(relay.url));
    loader.events.onEvent.subscribe((e) => this.handleEvent(e));
    this.process.addChild(loader.process);
    return loader;
  });

  events = new EventStore();

  log = logger.extend("ReplaceableEventLoader");

  constructor() {
    this.process = new Process("ReplaceableEventsService", this);
    this.process.icon = UserSquare;
    this.process.active = true;
    processManager.registerProcess(this.process);

    if (localRelay) {
      this.cacheLoader = new BatchKindPubkeyLoader(localRelay as AbstractRelay, this.log.extend("cache-relay"));
      this.cacheLoader.events.onEvent.subscribe((e) => this.handleEvent(e, true));
      this.process.addChild(this.cacheLoader.process);
    }
  }

  private seenInCache = new Set<string>();
  handleEvent(event: NostrEvent, fromCache = false) {
    if (!fromCache && !alwaysVerify(event)) return;
    const cord = getEventCoordinate(event);

    const subject = this.subjects.get(cord);
    const current = subject.value;
    if (!current || event.created_at > current.created_at) {
      subject.next(event);
      this.events.addEvent(event);

      if (!fromCache && localRelay && !this.seenInCache.has(event.id)) localRelay.publish(event);
    }

    if (fromCache) this.seenInCache.add(event.id);
  }

  getEvent(kind: number, pubkey: string, d?: string) {
    return this.subjects.get(createCoordinate(kind, pubkey, d));
  }

  private requestEventFromRelays(
    urls: Iterable<string | URL | AbstractRelay>,
    kind: number,
    pubkey: string,
    d?: string,
  ) {
    const cord = createCoordinate(kind, pubkey, d);
    const relays = relayPoolService.getRelays(urls);
    const sub = this.subjects.get(cord);

    for (const relay of relays) this.loaders.get(relay).requestEvent(kind, pubkey, d);

    return sub;
  }

  requestEvent(
    urls: Iterable<string | URL | AbstractRelay>,
    kind: number,
    pubkey: string,
    d?: string,
    opts: RequestOptions = {},
  ) {
    const key = createCoordinate(kind, pubkey, d);
    const relays = relayPoolService.getRelays(urls);
    const sub = this.subjects.get(key);

    if (!sub.value && this.cacheLoader) {
      this.cacheLoader.requestEvent(kind, pubkey, d).then((loaded) => {
        if (!loaded && !sub.value) this.requestEventFromRelays(relays, kind, pubkey, d);
      });
    }

    if (opts?.alwaysRequest || !this.cacheLoader || (!sub.value && opts.ignoreCache)) {
      this.requestEventFromRelays(relays, kind, pubkey, d);
    }

    return sub;
  }

  destroy() {
    processManager.unregisterProcess(this.process);
  }
}

const replaceableEventsService = new ReplaceableEventsService();

if (import.meta.env.DEV) {
  //@ts-ignore
  window.replaceableEventsService = replaceableEventsService;
}

export default replaceableEventsService;
