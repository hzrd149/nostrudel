import dayjs from "dayjs";
import debug, { Debugger } from "debug";
import _throttle from "lodash/throttle";
import { kinds } from "nostr-tools";

import NostrSubscription from "../classes/nostr-subscription";
import SuperMap from "../classes/super-map";
import { NostrEvent } from "../types/nostr-event";
import Subject from "../classes/subject";
import { NostrQuery } from "../types/nostr-query";
import { logger } from "../helpers/debug";
import db from "./db";
import createDefer, { Deferred } from "../classes/deferred";
import { getChannelPointer } from "../helpers/nostr/channel";

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

const RELAY_REQUEST_BATCH_TIME = 1000;

/** This class is ued to batch requests to a single relay */
class ChannelMetadataRelayLoader {
  private subscription: NostrSubscription;
  private events = new SuperMap<Pubkey, Subject<NostrEvent>>(() => new Subject<NostrEvent>());

  private requestNext = new Set<string>();
  private requested = new Map<string, Date>();

  log: Debugger;

  constructor(relay: string, log?: Debugger) {
    this.subscription = new NostrSubscription(relay, undefined, `channel-metadata-loader`);

    this.subscription.onEvent.subscribe(this.handleEvent.bind(this));
    this.subscription.onEOSE.subscribe(this.handleEOSE.bind(this));

    this.log = log || debug("misc");
  }

  private handleEvent(event: NostrEvent) {
    const channelId = getChannelPointer(event)?.id;
    if (!channelId) return;

    // remove the pubkey from the waiting list
    this.requested.delete(channelId);

    const sub = this.events.get(channelId);

    const current = sub.value;
    if (!current || event.created_at > current.created_at) {
      sub.next(event);
    }
  }
  private handleEOSE() {
    // relays says it has nothing left
    this.requested.clear();
  }

  getSubject(channelId: string) {
    return this.events.get(channelId);
  }

  requestMetadata(channelId: string) {
    const subject = this.events.get(channelId);

    if (!subject.value) {
      this.requestNext.add(channelId);
      this.updateThrottle();
    }

    return subject;
  }

  updateThrottle = _throttle(this.update, RELAY_REQUEST_BATCH_TIME);
  update() {
    let needsUpdate = false;
    for (const channelId of this.requestNext) {
      if (!this.requested.has(channelId)) {
        this.requested.set(channelId, new Date());
        needsUpdate = true;
      }
    }
    this.requestNext.clear();

    // prune requests
    const timeout = dayjs().subtract(1, "minute");
    for (const [channelId, date] of this.requested) {
      if (dayjs(date).isBefore(timeout)) {
        this.requested.delete(channelId);
        needsUpdate = true;
      }
    }

    // update the subscription
    if (needsUpdate) {
      if (this.requested.size > 0) {
        const query: NostrQuery = {
          kinds: [kinds.ChannelMetadata],
          "#e": Array.from(this.requested.keys()),
        };

        if (query["#e"] && query["#e"].length > 0) this.log(`Updating query`, query["#e"].length);
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

/** This is a clone of ReplaceableEventLoaderService to support channel metadata */
class ChannelMetadataService {
  private metadata = new SuperMap<Pubkey, Subject<NostrEvent>>(() => new Subject<NostrEvent>());

  private loaders = new SuperMap<Relay, ChannelMetadataRelayLoader>(
    (relay) => new ChannelMetadataRelayLoader(relay, this.log.extend(relay)),
  );

  log = logger.extend("ChannelMetadata");
  dbLog = this.log.extend("database");

  handleEvent(event: NostrEvent, saveToCache = true) {
    const channelId = getChannelPointer(event)?.id;
    if (!channelId) return;

    const sub = this.metadata.get(channelId);
    const current = sub.value;
    if (!current || event.created_at > current.created_at) {
      sub.next(event);
      if (saveToCache) this.saveToCache(channelId, event);
    }
  }

  getSubject(channelId: string) {
    return this.metadata.get(channelId);
  }

  private readFromCachePromises = new Map<string, Deferred<boolean>>();
  private readFromCacheThrottle = _throttle(this.readFromCache, READ_CACHE_BATCH_TIME);
  private async readFromCache() {
    if (this.readFromCachePromises.size === 0) return;

    let read = 0;
    const transaction = db.transaction("channelMetadata", "readonly");
    for (const [channelId, promise] of this.readFromCachePromises) {
      transaction
        .objectStore("channelMetadata")
        .get(channelId)
        .then((cached) => {
          if (cached?.event) {
            this.handleEvent(cached.event, false);
            promise.resolve(true);
            read++;
          }
          promise.resolve(false);
        });
    }
    this.readFromCachePromises.clear();
    transaction.commit();
    await transaction.done;
    if (read > 0) this.dbLog(`Read ${read} events from database`);
  }
  private loadCacheDedupe = new Map<string, Promise<boolean>>();
  loadFromCache(channelId: string) {
    const dedupe = this.loadCacheDedupe.get(channelId);
    if (dedupe) return dedupe;

    // add to read queue
    const promise = createDefer<boolean>();
    this.readFromCachePromises.set(channelId, promise);

    this.loadCacheDedupe.set(channelId, promise);
    this.readFromCacheThrottle();

    return promise;
  }

  private writeCacheQueue = new Map<string, NostrEvent>();
  private writeToCacheThrottle = _throttle(this.writeToCache, WRITE_CACHE_BATCH_TIME);
  private async writeToCache() {
    if (this.writeCacheQueue.size === 0) return;

    this.dbLog(`Writing ${this.writeCacheQueue.size} events to database`);
    const transaction = db.transaction("channelMetadata", "readwrite");
    for (const [channelId, event] of this.writeCacheQueue) {
      transaction.objectStore("channelMetadata").put({ channelId, event, created: dayjs().unix() });
    }
    this.writeCacheQueue.clear();
    transaction.commit();
    await transaction.done;
  }
  private async saveToCache(channelId: string, event: NostrEvent) {
    this.writeCacheQueue.set(channelId, event);
    this.writeToCacheThrottle();
  }

  async pruneDatabaseCache() {
    const keys = await db.getAllKeysFromIndex(
      "channelMetadata",
      // @ts-ignore
      "created",
      IDBKeyRange.upperBound(dayjs().subtract(1, "week").unix()),
    );

    if (keys.length === 0) return;
    this.dbLog(`Pruning ${keys.length} expired events from database`);
    const transaction = db.transaction("channelMetadata", "readwrite");
    for (const key of keys) {
      transaction.store.delete(key);
    }
    await transaction.commit();
  }

  private requestChannelMetadataFromRelays(relays: Iterable<string>, channelId: string) {
    const sub = this.metadata.get(channelId);

    const relayUrls = Array.from(relays);
    for (const relay of relayUrls) {
      const request = this.loaders.get(relay).requestMetadata(channelId);

      sub.connectWithHandler(request, (event, next, current) => {
        if (!current || event.created_at > current.created_at) {
          next(event);
          this.saveToCache(channelId, event);
        }
      });
    }

    return sub;
  }

  requestMetadata(relays: Iterable<string>, channelId: string, opts: RequestOptions = {}) {
    const sub = this.metadata.get(channelId);

    if (!sub.value) {
      this.loadFromCache(channelId).then((loaded) => {
        if (!loaded && !sub.value) this.requestChannelMetadataFromRelays(relays, channelId);
      });
    }

    if (opts?.alwaysRequest || (!sub.value && opts.ignoreCache)) {
      this.requestChannelMetadataFromRelays(relays, channelId);
    }

    return sub;
  }
}

const channelMetadataService = new ChannelMetadataService();

channelMetadataService.pruneDatabaseCache();
setInterval(
  () => {
    channelMetadataService.pruneDatabaseCache();
  },
  1000 * 60 * 60,
);

if (import.meta.env.DEV) {
  //@ts-ignore
  window.channelMetadataService = channelMetadataService;
}

export default channelMetadataService;
