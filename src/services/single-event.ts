import _throttle from "lodash.throttle";

import SuperMap from "../classes/super-map";
import { NostrEvent } from "../types/nostr-event";
import { localRelay } from "./local-relay";
import { logger } from "../helpers/debug";
import Subject from "../classes/subject";
import relayPoolService from "./relay-pool";
import Process from "../classes/process";
import { AbstractRelay } from "nostr-tools";
import PersistentSubscription from "../classes/persistent-subscription";
import processManager from "./process-manager";
import Code02 from "../components/icons/code-02";

const RELAY_REQUEST_BATCH_TIME = 500;

class SingleEventLoader {
  private subjects = new SuperMap<string, Subject<NostrEvent>>(() => new Subject<NostrEvent>());
  // pending = new SuperMap<string, Set<AbstractRelay>>(() => new Set());
  process: Process;
  log = logger.extend("SingleEventLoader");

  idsFromRelays = new SuperMap<AbstractRelay, Set<string>>(() => new Set());
  subscriptions = new Map<AbstractRelay, PersistentSubscription>();
  constructor() {
    this.process = new Process("SingleEventLoader", this);
    this.process.icon = Code02;
    processManager.registerProcess(this.process);
  }

  getSubject(id: string) {
    return this.subjects.get(id);
  }

  requestEvent(id: string, urls: Iterable<string | URL | AbstractRelay>) {
    const subject = this.subjects.get(id);
    if (subject.value) return subject;

    const relays = relayPoolService.getRelays(urls);
    for (const relay of relays) {
      // this.pending.get(id).add(relay);
      this.idsFromRelays.get(relay).add(id);
    }
    if (localRelay) this.idsFromRelays.get(localRelay as AbstractRelay).add(id);
    this.updateSubscriptionsThrottle();

    return subject;
  }

  handleEvent(event: NostrEvent, cache = true) {
    this.subjects.get(event.id).next(event);
    if (cache && localRelay) localRelay.publish(event);

    for (const [relay, ids] of this.idsFromRelays) {
      ids.delete(event.id);
    }
  }

  private updateSubscriptionsThrottle = _throttle(this.updateSubscriptions, RELAY_REQUEST_BATCH_TIME);
  async updateSubscriptions() {
    for (const [relay, ids] of this.idsFromRelays) {
      let subscription = this.subscriptions.get(relay);
      if (!subscription) {
        subscription = new PersistentSubscription(relay, {
          onevent: (event) => this.handleEvent(event),
          oneose: () => this.updateSubscriptionsThrottle(),
        });
        this.process.addChild(subscription.process);
        this.subscriptions.set(relay, subscription);
      }

      if (subscription) {
        if (ids.size === 0) {
          subscription.close();
        } else {
          // TODO: might be good to check if the ids have changed since last filter
          subscription.filters = [{ ids: Array.from(ids) }];
          subscription.update();
        }
      }
    }
  }
}

const singleEventService = new SingleEventLoader();

if (import.meta.env.DEV) {
  //@ts-expect-error
  window.singleEventService = singleEventService;
}

export default singleEventService;
