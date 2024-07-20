import { NostrEvent } from "nostr-tools";
import { AbstractRelay } from "nostr-tools/abstract-relay";

import { WIKI_PAGE_KIND } from "../helpers/nostr/wiki";
import { logger } from "../helpers/debug";
import Process from "../classes/process";
import SuperMap from "../classes/super-map";
import Subject from "../classes/subject";
import BatchIdentifierLoader from "../classes/batch-identifier-loader";
import BookOpen01 from "../components/icons/book-open-01";
import processManager from "./process-manager";
import { localRelay } from "./local-relay";
import relayPoolService from "./relay-pool";

class DictionaryService {
  log = logger.extend("DictionaryService");
  process: Process;

  topics = new SuperMap<string, Subject<Map<string, NostrEvent>>>(() => new Subject<Map<string, NostrEvent>>());

  loaders = new SuperMap<AbstractRelay, BatchIdentifierLoader>((relay) => {
    const loader = new BatchIdentifierLoader(relay, [WIKI_PAGE_KIND], this.log.extend(relay.url));
    this.process.addChild(loader.process);
    loader.onIdentifierUpdate.subscribe((identifier) => {
      this.updateSubject(identifier);
    });
    return loader;
  });

  constructor() {
    this.process = new Process("DictionaryService", this);
    this.process.icon = BookOpen01;
    this.process.active = true;

    processManager.registerProcess(this.process);
  }

  // merged results from all loaders for a single event
  private updateSubject(identifier: string) {
    const events = new Map<string, NostrEvent>();
    const subject = this.topics.get(identifier);

    for (const [relay, loader] of this.loaders) {
      if (loader.identifiers.has(identifier)) {
        const other = loader.identifiers.get(identifier);
        for (const [uid, e] of other) {
          if (e.content.trim().length === 0) continue;
          const existing = events.get(uid);
          if (!existing || e.created_at > existing.created_at) events.set(uid, e);
        }
      }
    }

    subject.next(events);
  }

  getTopic(topic: string) {
    return this.topics.get(topic);
  }

  requestTopic(topic: string, urls: Iterable<string | URL | AbstractRelay>, alwaysRequest = true) {
    const subject = this.topics.get(topic);
    if (subject.value && !alwaysRequest) return subject;

    if (localRelay) {
      this.loaders.get(localRelay as AbstractRelay).requestEvents(topic);
    }

    const relays = relayPoolService.getRelays(urls);
    for (const relay of relays) {
      this.loaders.get(relay).requestEvents(topic);
    }

    return subject;
  }

  handleEvent(event: NostrEvent) {
    // pretend it came from the local relay
    if (localRelay) this.loaders.get(localRelay as AbstractRelay).handleEvent(event);
  }
}

const dictionaryService = new DictionaryService();

if (import.meta.env.DEV) {
  // @ts-expect-error
  window.dictionaryService = dictionaryService;
}

export default dictionaryService;
