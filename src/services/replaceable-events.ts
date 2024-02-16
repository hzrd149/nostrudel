import _throttle from "lodash/throttle";
import { Filter, NostrEvent } from "nostr-tools";

import SuperMap from "../classes/super-map";
import { logger } from "../helpers/debug";
import { nameOrPubkey } from "./user-metadata";
import { getEventCoordinate } from "../helpers/nostr/event";
import createDefer, { Deferred } from "../classes/deferred";
import { localRelay } from "./local-relay";
import { relayRequest } from "../helpers/relay";
import EventStore from "../classes/event-store";
import Subject from "../classes/subject";
import BatchKindLoader, { createCoordinate } from "../classes/batch-kind-loader";

export type RequestOptions = {
  /** Always request the event from the relays */
  alwaysRequest?: boolean;
  /** ignore the cache on initial load */
  ignoreCache?: boolean;
  // TODO: figure out a clean way for useReplaceableEvent hook to "unset" or "unsubscribe"
  // keepAlive?: boolean;
};

export function getHumanReadableCoordinate(kind: number, pubkey: string, d?: string) {
  return `${kind}:${nameOrPubkey(pubkey)}${d ? ":" + d : ""}`;
}

const READ_CACHE_BATCH_TIME = 250;
const WRITE_CACHE_BATCH_TIME = 250;

class ReplaceableEventsService {
  private subjects = new SuperMap<string, Subject<NostrEvent>>(() => new Subject<NostrEvent>());
  private loaders = new SuperMap<string, BatchKindLoader>((relay) => {
    const loader = new BatchKindLoader(relay, this.log.extend(relay));
    loader.events.onEvent.subscribe((e) => this.handleEvent(e));
    return loader;
  });

  events = new EventStore();

  log = logger.extend("ReplaceableEventLoader");
  dbLog = this.log.extend("database");

  handleEvent(event: NostrEvent, saveToCache = true) {
    const cord = getEventCoordinate(event);

    const subject = this.subjects.get(cord);
    const current = subject.value;
    if (!current || event.created_at > current.created_at) {
      subject.next(event);
      this.events.addEvent(event);
      if (saveToCache) this.saveToCache(cord, event);
    }
  }

  getEvent(kind: number, pubkey: string, d?: string) {
    return this.subjects.get(createCoordinate(kind, pubkey, d));
  }

  private readFromCachePromises = new Map<string, Deferred<boolean>>();
  private readFromCacheThrottle = _throttle(this.readFromCache, READ_CACHE_BATCH_TIME);
  private async readFromCache() {
    if (this.readFromCachePromises.size === 0) return;

    const loading = new Map<string, Deferred<boolean>>();

    const kindFilters: Record<number, Filter> = {};
    for (const [cord, p] of this.readFromCachePromises) {
      const [kindStr, pubkey, d] = cord.split(":") as [string, string] | [string, string, string];
      const kind = parseInt(kindStr);
      kindFilters[kind] = kindFilters[kind] || { kinds: [kind] };

      const arr = (kindFilters[kind].authors = kindFilters[kind].authors || []);
      arr.push(pubkey);

      if (d) {
        const arr = (kindFilters[kind]["#d"] = kindFilters[kind]["#d"] || []);
        arr.push(d);
      }

      loading.set(cord, p);
    }
    const filters = Object.values(kindFilters);

    for (const [cord] of loading) this.readFromCachePromises.delete(cord);

    const events = await relayRequest(localRelay, filters);
    for (const event of events) {
      this.handleEvent(event, false);
      const cord = getEventCoordinate(event);
      const promise = loading.get(cord);
      if (promise) promise.resolve(true);
      loading.delete(cord);
    }

    // resolve remaining promises
    for (const [_, promise] of loading) promise.resolve();

    if (events.length > 0) this.dbLog(`Read ${events.length} events from database`);
  }
  loadFromCache(cord: string) {
    const dedupe = this.readFromCachePromises.get(cord);
    if (dedupe) return dedupe;

    // add to read queue
    const promise = createDefer<boolean>();
    this.readFromCachePromises.set(cord, promise);

    this.readFromCacheThrottle();

    return promise;
  }

  private writeCacheQueue = new Map<string, NostrEvent>();
  private writeToCacheThrottle = _throttle(this.writeToCache, WRITE_CACHE_BATCH_TIME);
  private async writeToCache() {
    if (this.writeCacheQueue.size === 0) return;

    this.dbLog(`Writing ${this.writeCacheQueue.size} events to database`);
    for (const [_, event] of this.writeCacheQueue) localRelay.publish(event);
    this.writeCacheQueue.clear();
  }
  private async saveToCache(cord: string, event: NostrEvent) {
    this.writeCacheQueue.set(cord, event);
    this.writeToCacheThrottle();
  }

  private requestEventFromRelays(relays: Iterable<string>, kind: number, pubkey: string, d?: string) {
    const cord = createCoordinate(kind, pubkey, d);
    const sub = this.subjects.get(cord);

    for (const relay of relays) this.loaders.get(relay).requestEvent(kind, pubkey, d);

    return sub;
  }

  requestEvent(relays: Iterable<string>, kind: number, pubkey: string, d?: string, opts: RequestOptions = {}) {
    const key = createCoordinate(kind, pubkey, d);
    const sub = this.subjects.get(key);

    if (!sub.value) {
      this.loadFromCache(key).then((loaded) => {
        if (!loaded && !sub.value) this.requestEventFromRelays(relays, kind, pubkey, d);
      });
    }

    if (opts?.alwaysRequest || (!sub.value && opts.ignoreCache)) {
      this.requestEventFromRelays(relays, kind, pubkey, d);
    }

    return sub;
  }
}

const replaceableEventsService = new ReplaceableEventsService();

if (import.meta.env.DEV) {
  //@ts-ignore
  window.replaceableEventsService = replaceableEventsService;
}

export default replaceableEventsService;
