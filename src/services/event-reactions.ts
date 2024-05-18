import { AbstractRelay, kinds } from "nostr-tools";
import _throttle from "lodash.throttle";

import Subject from "../classes/subject";
import SuperMap from "../classes/super-map";
import { NostrEvent } from "../types/nostr-event";
import { localRelay } from "./local-relay";
import relayPoolService from "./relay-pool";
import Process from "../classes/process";
import { LightningIcon } from "../components/icons";
import processManager from "./process-manager";
import BatchRelationLoader from "../classes/batch-relation-loader";
import { logger } from "../helpers/debug";

class EventReactionsService {
  log = logger.extend("EventReactionsService");
  process: Process;

  subjects = new SuperMap<string, Subject<NostrEvent[]>>(() => new Subject<NostrEvent[]>([]));

  loaders = new SuperMap<AbstractRelay, BatchRelationLoader>((relay) => {
    const loader = new BatchRelationLoader(relay, [kinds.Reaction], this.log.extend(relay.url));
    this.process.addChild(loader.process);
    loader.onEventUpdate.subscribe((id) => {
      this.updateSubject(id);
    });
    return loader;
  });

  constructor() {
    this.process = new Process("EventReactionsService", this);
    this.process.icon = LightningIcon;
    this.process.active = true;

    processManager.registerProcess(this.process);
  }

  // merged results from all loaders for a single event
  private updateSubject(id: string) {
    const ids = new Set<string>();
    const events: NostrEvent[] = [];
    const subject = this.subjects.get(id);

    for (const [relay, loader] of this.loaders) {
      if (loader.references.has(id)) {
        const other = loader.references.get(id);
        for (const [_, e] of other) {
          if (!ids.has(e.id)) {
            ids.add(e.id);
            events.push(e);
          }
        }
      }
    }

    subject.next(events);
  }

  requestReactions(eventUID: string, urls: Iterable<string | URL | AbstractRelay>, alwaysRequest = true) {
    const subject = this.subjects.get(eventUID);
    if (subject.value && !alwaysRequest) return subject;

    if (localRelay) {
      this.loaders.get(localRelay as AbstractRelay).requestEvents(eventUID);
    }

    const relays = relayPoolService.getRelays(urls);
    for (const relay of relays) {
      this.loaders.get(relay).requestEvents(eventUID);
    }

    return subject;
  }

  handleEvent(event: NostrEvent) {
    // pretend it came from the local relay
    if (localRelay) this.loaders.get(localRelay as AbstractRelay).handleEvent(event);
  }
}

const eventReactionsService = new EventReactionsService();

if (import.meta.env.DEV) {
  // @ts-ignore
  window.eventReactionsService = eventReactionsService;
}

export default eventReactionsService;
