import dayjs from "dayjs";
import debug, { Debugger } from "debug";
import { NostrSubscription } from "../classes/nostr-subscription";
import { SuperMap } from "../classes/super-map";
import { NostrEvent } from "../types/nostr-event";
import Subject from "../classes/subject";
import { NostrQuery } from "../types/nostr-query";
import { logger, nameOrPubkey } from "../helpers/debug";
import db from "./db";

type Pubkey = string;
type Relay = string;

export function getReadableAddr(kind: number, pubkey: string, d?: string) {
  return `${kind}:${nameOrPubkey(pubkey)}${d ? ":" + d : ""}`;
}
export function getAddr(kind: number, pubkey: string, d?: string) {
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
    const d = event.tags.find((t) => t[0] === "d" && t[1])?.[1];
    const addr = getAddr(event.kind, event.pubkey, d);

    // remove the pubkey from the waiting list
    this.requested.delete(addr);

    const sub = this.events.get(addr);

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
    return this.events.get(getAddr(kind, pubkey, d));
  }

  requestEvent(kind: number, pubkey: string, d?: string) {
    const addr = getAddr(kind, pubkey, d);
    const event = this.events.get(addr);

    if (!event.value) {
      this.requestNext.add(addr);
    }

    return event;
  }

  update() {
    let needsUpdate = false;
    for (const addr of this.requestNext) {
      if (!this.requested.has(addr)) {
        this.requested.set(addr, new Date());
        needsUpdate = true;
      }
    }
    this.requestNext.clear();

    // prune requests
    const timeout = dayjs().subtract(1, "minute");
    for (const [addr, date] of this.requested) {
      if (dayjs(date).isBefore(timeout)) {
        this.requested.delete(addr);
        needsUpdate = true;
      }
    }

    // update the subscription
    if (needsUpdate) {
      if (this.requested.size > 0) {
        const filters: Record<number, NostrQuery> = {};

        for (const [addr] of this.requested) {
          const [kindStr, pubkey, d] = addr.split(":") as [string, string] | [string, string, string];
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
            .join(", ")
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
    (relay) => new ReplaceableEventRelayLoader(relay, this.log.extend(relay))
  );

  log = logger.extend("ReplaceableEventLoader");

  handleEvent(event: NostrEvent) {
    const d = event.tags.find((t) => t[0] === "d" && t[1])?.[1];
    const addr = getAddr(event.kind, event.pubkey, d);

    const sub = this.events.get(addr);
    const current = sub.value;
    if (!current || event.created_at > current.created_at) {
      sub.next(event);
      this.saveToCache(addr, event);
    }
  }

  getEvent(kind: number, pubkey: string, d?: string) {
    return this.events.get(getAddr(kind, pubkey, d));
  }

  private loadCacheDedupe = new Map<string, Promise<boolean>>();
  private loadFromCache(addr: string) {
    const dedupe = this.loadCacheDedupe.get(addr);
    if (dedupe) return dedupe;

    const promise = db.get("replaceableEvents", addr).then((cached) => {
      this.loadCacheDedupe.delete(addr);
      if (cached?.event) {
        this.handleEvent(cached.event);
        return true;
      }
      return false;
    });

    this.loadCacheDedupe.set(addr, promise);

    return promise;
  }
  private async saveToCache(addr: string, event: NostrEvent) {
    await db.put("replaceableEvents", { addr, event, created: dayjs().unix() });
  }

  async pruneCache() {
    const keys = await db.getAllKeysFromIndex(
      "replaceableEvents",
      "created",
      IDBKeyRange.upperBound(dayjs().subtract(1, "day").unix())
    );

    this.log(`Pruning ${keys.length} events`);

    const transaction = db.transaction("replaceableEvents", "readwrite");
    for (const key of keys) {
      transaction.store.delete(key);
    }
    await transaction.commit();
  }

  private requestEventFromRelays(relays: string[], kind: number, pubkey: string, d?: string) {
    const addr = getAddr(kind, pubkey, d);
    const sub = this.events.get(addr);

    for (const relay of relays) {
      const request = this.loaders.get(relay).requestEvent(kind, pubkey, d);

      sub.connectWithHandler(request, (event, next, current) => {
        if (!current || event.created_at > current.created_at) {
          next(event);
          this.saveToCache(addr, event);
        }
      });
    }

    return sub;
  }

  requestEvent(relays: string[], kind: number, pubkey: string, d?: string, alwaysRequest = false) {
    const addr = getAddr(kind, pubkey, d);
    const sub = this.events.get(addr);

    if (!sub.value) {
      this.loadFromCache(addr).then((loaded) => {
        if (!loaded) {
          this.requestEventFromRelays(relays, kind, pubkey, d);
        }
      });
    }

    if (alwaysRequest) {
      this.requestEventFromRelays(relays, kind, pubkey, d);
    }

    return sub;
  }

  update() {
    for (const [relay, loader] of this.loaders) {
      loader.update();
    }
  }
}

const replaceableEventLoaderService = new ReplaceableEventLoaderService();

replaceableEventLoaderService.pruneCache();

setInterval(() => {
  replaceableEventLoaderService.update();
}, 1000 * 2);
setInterval(() => {
  replaceableEventLoaderService.pruneCache();
}, 1000 * 60 * 60);

if (import.meta.env.DEV) {
  //@ts-ignore
  window.replaceableEventLoaderService = replaceableEventLoaderService;
}

export default replaceableEventLoaderService;
