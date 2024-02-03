import dayjs from "dayjs";
import debug, { Debugger } from "debug";
import _throttle from "lodash/throttle";
import { Filter } from "nostr-tools";

import NostrSubscription from "../classes/nostr-subscription";
import SuperMap from "../classes/super-map";
import { NostrEvent } from "../types/nostr-event";
import Subject from "../classes/subject";
import { NostrQuery } from "../types/nostr-query";
import { logger } from "../helpers/debug";
import { nameOrPubkey } from "./user-metadata";
import { getEventCoordinate } from "../helpers/nostr/events";
import createDefer, { Deferred } from "../classes/deferred";
import { localRelay } from "./local-relay";
import { relayRequest } from "../helpers/relay";

type Pubkey = string;
type Relay = string;

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
export function createCoordinate(kind: number, pubkey: string, d?: string) {
  return `${kind}:${pubkey}${d ? ":" + d : ""}`;
}

const RELAY_REQUEST_BATCH_TIME = 500;

/** This class is ued to batch requests to a single relay */
class ReplaceableEventRelayLoader {
  private subscription: NostrSubscription;
  private events = new SuperMap<Pubkey, Subject<NostrEvent>>(() => new Subject<NostrEvent>());

  private requestNext = new Set<string>();
  private requested = new Map<string, Date>();

  log: Debugger;

  constructor(relay: string, log?: Debugger) {
    this.subscription = new NostrSubscription(relay, undefined, `replaceable-event-loader`);

    this.subscription.onEvent.subscribe(this.handleEvent.bind(this));
    this.subscription.onEOSE.subscribe(this.handleEOSE.bind(this));

    this.log = log || debug("misc");
  }

  private handleEvent(event: NostrEvent) {
    const cord = getEventCoordinate(event);

    // remove the pubkey from the waiting list
    this.requested.delete(cord);

    const sub = this.events.get(cord);

    const current = sub.value;
    if (!current || event.created_at > current.created_at) {
      sub.next(event);
    }
  }
  private handleEOSE() {
    // relays says it has nothing left
    this.requested.clear();
  }

  getEvent(kind: number, pubkey: string, d?: string) {
    return this.events.get(createCoordinate(kind, pubkey, d));
  }

  requestEvent(kind: number, pubkey: string, d?: string) {
    const cord = createCoordinate(kind, pubkey, d);
    const event = this.events.get(cord);

    if (!event.value) {
      this.requestNext.add(cord);
      this.updateThrottle();
    }

    return event;
  }

  updateThrottle = _throttle(this.update, RELAY_REQUEST_BATCH_TIME);
  update() {
    let needsUpdate = false;
    for (const cord of this.requestNext) {
      if (!this.requested.has(cord)) {
        this.requested.set(cord, new Date());
        needsUpdate = true;
      }
    }
    this.requestNext.clear();

    // prune requests
    const timeout = dayjs().subtract(1, "minute");
    for (const [cord, date] of this.requested) {
      if (dayjs(date).isBefore(timeout)) {
        this.requested.delete(cord);
        needsUpdate = true;
      }
    }

    // update the subscription
    if (needsUpdate) {
      if (this.requested.size > 0) {
        const filters: Record<number, NostrQuery> = {};

        for (const [cord] of this.requested) {
          const [kindStr, pubkey, d] = cord.split(":") as [string, string] | [string, string, string];
          const kind = parseInt(kindStr);
          filters[kind] = filters[kind] || { kinds: [kind] };

          const arr = (filters[kind].authors = filters[kind].authors || []);
          arr.push(pubkey);

          if (d) {
            const arr = (filters[kind]["#d"] = filters[kind]["#d"] || []);
            arr.push(d);
          }
        }

        const query = Array.from(Object.values(filters));

        this.log(
          `Updating query`,
          Array.from(Object.keys(filters))
            .map((kind: string) => `kind ${kind}: ${filters[parseInt(kind)].authors?.length}`)
            .join(", "),
        );
        this.subscription.setQuery(query);

        if (this.subscription.state !== NostrSubscription.OPEN) {
          this.subscription.open();
        }
      } else if (this.subscription.state === NostrSubscription.OPEN) {
        this.subscription.close();
      }
    }
  }
}

const READ_CACHE_BATCH_TIME = 250;
const WRITE_CACHE_BATCH_TIME = 250;

class ReplaceableEventLoaderService {
  private events = new SuperMap<Pubkey, Subject<NostrEvent>>(() => new Subject<NostrEvent>());

  private loaders = new SuperMap<Relay, ReplaceableEventRelayLoader>(
    (relay) => new ReplaceableEventRelayLoader(relay, this.log.extend(relay)),
  );

  log = logger.extend("ReplaceableEventLoader");
  dbLog = this.log.extend("database");

  handleEvent(event: NostrEvent, saveToCache = true) {
    const cord = getEventCoordinate(event);

    const sub = this.events.get(cord);
    const current = sub.value;
    if (!current || event.created_at > current.created_at) {
      sub.next(event);
      if (saveToCache) {
        this.saveToCache(cord, event);
      }
    }
  }

  getEvent(kind: number, pubkey: string, d?: string) {
    return this.events.get(createCoordinate(kind, pubkey, d));
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
    const sub = this.events.get(cord);

    for (const relay of relays) {
      const request = this.loaders.get(relay).requestEvent(kind, pubkey, d);

      sub.connectWithHandler(request, (event, next, current) => {
        if (!current || event.created_at > current.created_at) {
          next(event);
          this.saveToCache(cord, event);
        }
      });
    }

    return sub;
  }

  requestEvent(relays: Iterable<string>, kind: number, pubkey: string, d?: string, opts: RequestOptions = {}) {
    const cord = createCoordinate(kind, pubkey, d);
    const sub = this.events.get(cord);

    if (!sub.value) {
      this.loadFromCache(cord).then((loaded) => {
        if (!loaded && !sub.value) this.requestEventFromRelays(relays, kind, pubkey, d);
      });
    }

    if (opts?.alwaysRequest || (!sub.value && opts.ignoreCache)) {
      this.requestEventFromRelays(relays, kind, pubkey, d);
    }

    return sub;
  }
}

const replaceableEventLoaderService = new ReplaceableEventLoaderService();

if (import.meta.env.DEV) {
  //@ts-ignore
  window.replaceableEventLoaderService = replaceableEventLoaderService;
}

export default replaceableEventLoaderService;
