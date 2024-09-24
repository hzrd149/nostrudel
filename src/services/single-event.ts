import _throttle from "lodash.throttle";
import { AbstractRelay } from "nostr-tools/abstract-relay";

import SuperMap from "../classes/super-map";
import { NostrEvent } from "../types/nostr-event";
import { localRelay } from "./local-relay";
import { logger } from "../helpers/debug";
import Subject from "../classes/subject";
import relayPoolService from "./relay-pool";
import Process from "../classes/process";
import processManager from "./process-manager";
import Code02 from "../components/icons/code-02";
import BatchEventLoader from "../classes/batch-event-loader";
import EventStore from "../classes/event-store";
import { eventStore } from "./event-store";

class SingleEventService {
  process: Process;
  log = logger.extend("SingleEventService");

  // events = new EventStore();
  // subjects = new SuperMap<string, Subject<NostrEvent>>(() => new Subject<NostrEvent>());

  loaders = new SuperMap<AbstractRelay, BatchEventLoader>((relay) => {
    const loader = new BatchEventLoader(relay, this.log.extend(relay.url));
    this.process.addChild(loader.process);
    // this.events.connect(loader.events);
    return loader;
  });

  pendingRelays = new SuperMap<string, Set<AbstractRelay>>(() => new Set());

  idsFromRelays = new SuperMap<AbstractRelay, Set<string>>(() => new Set());
  // subscriptions = new Map<AbstractRelay, PersistentSubscription>();
  constructor() {
    this.process = new Process("SingleEventService", this);
    this.process.icon = Code02;
    this.process.active = true;
    processManager.registerProcess(this.process);

    // when an event is added to the store, pass it along to the subjects
    // this.events.onEvent.subscribe((event) => {
    //   this.subjects.get(event.id).next(event);
    // });
  }

  // getSubject(id: string) {
  //   return this.subjects.get(id);
  // }

  private loadEventFromRelays(id: string) {
    const relays = this.pendingRelays.get(id);

    for (const relay of relays) {
      this.loaders.get(relay).requestEvent(id);
    }
  }

  loadingFromCache = new Set<string>();
  requestEvent(id: string, urls: Iterable<string | URL | AbstractRelay>) {
    if (eventStore.hasEvent(id)) return;
    // const subject = this.subjects.get(id);
    // if (subject.value) return subject;

    const relays = relayPoolService.getRelays(urls);
    for (const relay of relays) this.pendingRelays.get(id).add(relay);

    // load from the local relay first
    if (localRelay) {
      if (!this.loadingFromCache.has(id)) {
        this.loadingFromCache.add(id);

        this.loaders
          .get(localRelay as AbstractRelay)
          .requestEvent(id)
          .then((cached) => {
            this.loadingFromCache.delete(id);
            if (cached) this.handleEvent(cached, true);
            else this.loadEventFromRelays(id);
          });
      }
    } else this.loadEventFromRelays(id);

    // return subject;
  }

  handleEvent(event: NostrEvent, fromCache = false) {
    // this.events.addEvent(event);
    this.pendingRelays.delete(event.id);

    eventStore.add(event);

    if (!fromCache && localRelay) localRelay.publish(event);
  }
}

const singleEventService = new SingleEventService();

if (import.meta.env.DEV) {
  //@ts-expect-error
  window.singleEventService = singleEventService;
}

export default singleEventService;
