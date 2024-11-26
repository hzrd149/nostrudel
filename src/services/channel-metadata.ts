import dayjs from "dayjs";
import { Debugger } from "debug";
import _throttle from "lodash.throttle";
import { Filter, kinds } from "nostr-tools";
import { getChannelPointer } from "applesauce-channel";

import SuperMap from "../classes/super-map";
import { NostrEvent } from "../types/nostr-event";
import { logger } from "../helpers/debug";
import { eventStore } from "./event-store";
import relayPoolService from "./relay-pool";
import PersistentSubscription from "../classes/persistent-subscription";
import { localRelay } from "./local-relay";
import { isFromCache, markFromCache } from "applesauce-core/helpers";
import { AbstractRelay } from "nostr-tools/abstract-relay";

export type RequestOptions = {
  /** Always request the event from the relays */
  alwaysRequest?: boolean;
  /** ignore the cache on initial load */
  ignoreCache?: boolean;
};

const RELAY_REQUEST_BATCH_TIME = 1000;

/** This class is ued to batch requests to a single relay */
class ChannelMetadataRelayLoader {
  private subscription: PersistentSubscription;

  private requestNext = new Set<string>();
  private requested = new Map<string, Date>();

  log: Debugger;
  isCache = false;

  constructor(relay: AbstractRelay, log?: Debugger) {
    this.log = log || logger.extend("ChannelMetadataRelayLoader");
    this.subscription = new PersistentSubscription(relay, {
      onevent: (event) => this.handleEvent(event),
      oneose: () => this.handleEOSE(),
    });
  }

  private handleEvent(event: NostrEvent) {
    const channelId = getChannelPointer(event)?.id;
    if (!channelId) return;

    // remove the pubkey from the waiting list
    this.requested.delete(channelId);

    if (this.isCache) markFromCache(event);

    eventStore.add(event);
  }
  private handleEOSE() {
    // relays says it has nothing left
    this.requested.clear();
  }

  requestMetadata(channelId: string) {
    this.requestNext.add(channelId);
    this.updateThrottle();
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
        const query: Filter = {
          kinds: [kinds.ChannelMetadata],
          "#e": Array.from(this.requested.keys()),
        };

        if (query["#e"] && query["#e"].length > 0) this.log(`Updating query`, query["#e"].length);
        this.subscription.filters = [query];

        this.subscription.update();
      } else {
        this.subscription.close();
      }
    }
  }
}

/** This is a clone of ReplaceableEventLoaderService to support channel metadata */
class ChannelMetadataService {
  private loaders = new SuperMap<AbstractRelay, ChannelMetadataRelayLoader>(
    (relay) => new ChannelMetadataRelayLoader(relay, this.log.extend(relay.url)),
  );

  log = logger.extend("ChannelMetadata");

  constructor() {
    if (localRelay) {
      const loader = this.loaders.get(localRelay as AbstractRelay);
      loader.isCache = true;
    }
  }

  handleEvent(event: NostrEvent) {
    eventStore.add(event);

    const channelId = getChannelPointer(event)?.id;
    if (!channelId) return;

    if (!isFromCache(event)) localRelay?.publish(event);
  }

  private requestChannelMetadataFromRelays(relays: Iterable<string>, channelId: string) {
    const relayUrls = Array.from(relays);
    for (const url of relayUrls) {
      const relay = relayPoolService.getRelay(url);
      if (relay) this.loaders.get(relay).requestMetadata(channelId);
    }
  }

  private loaded = new Map<string, boolean>();
  requestMetadata(relays: Iterable<string>, channelId: string, opts: RequestOptions = {}) {
    const loaded = this.loaded.get(channelId);

    if (!loaded && localRelay) {
      this.loaders.get(localRelay as AbstractRelay).requestMetadata(channelId);
    }

    if (opts?.alwaysRequest || (!loaded && opts.ignoreCache)) {
      this.requestChannelMetadataFromRelays(relays, channelId);
    }
  }
}

const channelMetadataService = new ChannelMetadataService();

if (import.meta.env.DEV) {
  //@ts-ignore
  window.channelMetadataService = channelMetadataService;
}

export default channelMetadataService;
