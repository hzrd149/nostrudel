import dayjs from "dayjs";
import debug, { Debugger } from "debug";
import _throttle from "lodash/throttle";

import { NostrSubscription } from "../classes/nostr-subscription";
import { SuperMap } from "../classes/super-map";
import { NostrEvent } from "../types/nostr-event";
import Subject from "../classes/subject";
import { NostrQuery } from "../types/nostr-query";
import { logger } from "../helpers/debug";
import db from "./db";
import { nameOrPubkey } from "./user-metadata";
import { getEventCoordinate } from "../helpers/nostr/events";
import createDefer, { Deferred } from "../classes/deferred";

type Pubkey = string;
type Relay = string;

export function getHumanReadableCoordinate(kind: number, pubkey: string, d?: string) {
  return `${kind}:${nameOrPubkey(pubkey)}${d ? ":" + d : ""}`;
}
export function createCoordinate(kind: number, pubkey: string, d?: string) {
  return `${kind}:${pubkey}${d ? ":" + d : ""}`;
}

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

  updateThrottle = _throttle(this.update, 1000);
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
      if (saveToCache) this.saveToCache(cord, event);
    }
  }

  getEvent(kind: number, pubkey: string, d?: string) {
    return this.events.get(createCoordinate(kind, pubkey, d));
  }

  private readFromCachePromises = new Map<string, Deferred<boolean>>();
  private readFromCacheThrottle = _throttle(this.readFromCache, 1000);
  private async readFromCache() {
    if (this.readFromCachePromises.size === 0) return;

    this.dbLog(`Reading ${this.readFromCachePromises.size} events from database`);
    const transaction = db.transaction("replaceableEvents", "readonly");
    for (const [cord, promise] of this.readFromCachePromises) {
      transaction
        .objectStore("replaceableEvents")
        .get(cord)
        .then((cached) => {
          if (cached?.event) {
            this.handleEvent(cached.event, false);
            promise.resolve(true);
          }
          promise.resolve(false);
        });
    }
    this.readFromCachePromises.clear();
    transaction.commit();
    await transaction.done;
  }
  private loadCacheDedupe = new Map<string, Promise<boolean>>();
  private loadFromCache(cord: string) {
    const dedupe = this.loadCacheDedupe.get(cord);
    if (dedupe) return dedupe;

    // add to read queue
    const promise = createDefer<boolean>();
    this.readFromCachePromises.set(cord, promise);

    this.loadCacheDedupe.set(cord, promise);
    this.readFromCacheThrottle();

    return promise;
  }

  private writeCacheQueue = new Map<string, NostrEvent>();
  private writeToCacheThrottle = _throttle(this.writeToCache, 1000);
  private async writeToCache() {
    if (this.writeCacheQueue.size === 0) return;

    this.dbLog(`Writing ${this.writeCacheQueue.size} events to database`);
    const transaction = db.transaction("replaceableEvents", "readwrite");
    for (const [cord, event] of this.writeCacheQueue) {
      transaction.objectStore("replaceableEvents").put({ addr: cord, event, created: dayjs().unix() });
    }
    this.writeCacheQueue.clear();
    transaction.commit();
    await transaction.done;
  }
  private async saveToCache(cord: string, event: NostrEvent) {
    this.writeCacheQueue.set(cord, event);
    this.writeToCacheThrottle();
  }

  async pruneDatabaseCache() {
    const keys = await db.getAllKeysFromIndex(
      "replaceableEvents",
      "created",
      IDBKeyRange.upperBound(dayjs().subtract(1, "day").unix()),
    );

    this.dbLog(`Pruning ${keys.length} expired events from database`);
    const transaction = db.transaction("replaceableEvents", "readwrite");
    for (const key of keys) {
      transaction.store.delete(key);
    }
    await transaction.commit();
  }

  private requestEventFromRelays(relays: string[], kind: number, pubkey: string, d?: string) {
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

  requestEvent(relays: string[], kind: number, pubkey: string, d?: string, alwaysRequest = false) {
    const cord = createCoordinate(kind, pubkey, d);
    const sub = this.events.get(cord);

    if (!sub.value) {
      this.loadFromCache(cord).then((loaded) => {
        if (!loaded) this.requestEventFromRelays(relays, kind, pubkey, d);
      });
    }

    if (alwaysRequest) {
      this.requestEventFromRelays(relays, kind, pubkey, d);
    }

    return sub;
  }
}

const replaceableEventLoaderService = new ReplaceableEventLoaderService();

replaceableEventLoaderService.pruneDatabaseCache();
setInterval(() => {
  replaceableEventLoaderService.pruneDatabaseCache();
}, 1000 * 60);

if (import.meta.env.DEV) {
  //@ts-ignore
  window.replaceableEventLoaderService = replaceableEventLoaderService;
}

export default replaceableEventLoaderService;
