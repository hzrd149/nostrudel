import { Debugger } from "debug";
import { Filter, NostrEvent, matchFilters } from "nostr-tools";
import { AbstractRelay } from "nostr-tools/abstract-relay";
import { SimpleRelay } from "nostr-idb";
import _throttle from "lodash.throttle";
import { nanoid } from "nanoid";
import { Subject } from "rxjs";

import { logger } from "../helpers/debug";
import EventStore from "./event-store";
import deleteEventService from "../services/delete-events";
import { mergeFilter } from "../helpers/nostr/filter";
import { isATag, isETag } from "../types/nostr-event";
import relayPoolService from "../services/relay-pool";
import Process from "./process";
import processManager from "../services/process-manager";
import LayersThree01 from "../components/icons/layers-three-01";
import { eventStore } from "../services/event-store";

const DEFAULT_CHUNK_SIZE = 100;

export type EventFilter = (event: NostrEvent) => boolean;

/** @deprecated this should be replaced with a rx-nostr based timeline loader */
export default class ChunkedRequest {
  id: string;
  process: Process;
  relay: AbstractRelay;
  filters: Filter[];
  chunkSize = DEFAULT_CHUNK_SIZE;
  private log: Debugger;
  private subs: ZenObservable.Subscription[] = [];

  loading = false;
  events: EventStore;
  /** set to true when the next chunk produces 0 events */
  complete = false;

  private lastChunkIdx = 0;
  onChunkFinish = new Subject<number>();

  constructor(relay: SimpleRelay | AbstractRelay, filters: Filter[], log?: Debugger) {
    this.id = nanoid(8);
    this.process = new Process("ChunkedRequest", this, [relay]);
    this.process.icon = LayersThree01;
    this.relay = relay as AbstractRelay;
    this.filters = filters;

    this.log = log || logger.extend(relay.url);
    this.events = new EventStore(relay.url);

    // TODO: find a better place for this
    this.subs.push(deleteEventService.stream.subscribe((e) => this.handleDeleteEvent(e)));

    processManager.registerProcess(this.process);
  }

  async loadNextChunk() {
    if (this.loading) return;

    // check if its possible to subscribe to this relay
    if (!relayPoolService.canSubscribe(this.relay)) {
      this.log("Cant subscribe to relay, aborting");
      return;
    }

    this.loading = true;

    if (!this.relay.connected) {
      this.log("requesting relay connection");
      relayPoolService.requestConnect(this.relay);
      this.loading = false;
      return;
    }

    let filters: Filter[] = mergeFilter(this.filters, { limit: this.chunkSize });
    const oldestEvent = this.getLastEvent();
    if (oldestEvent) {
      filters = mergeFilter(filters, { until: oldestEvent.created_at - 1 });
    }

    let gotEvents = 0;

    this.process.active = true;
    await new Promise<number>((res) => {
      const sub = this.relay.subscribe(filters, {
        id: this.id + "-" + this.lastChunkIdx++,
        onevent: (event) => {
          this.handleEvent(event);
          gotEvents++;
        },
        oneose: () => {
          this.loading = false;
          if (gotEvents === 0) {
            this.complete = true;
            this.log("Complete");
          } else {
            this.log(`Got ${gotEvents} events`);
          }

          this.onChunkFinish.next(gotEvents);
          sub.close();
          this.process.active = false;
          res(gotEvents);
        },
        onclose: (reason) => {
          relayPoolService.handleRelayNotice(this.relay, reason);
        },
      });
    });
  }

  private handleEvent(event: NostrEvent) {
    if (!matchFilters(this.filters, event)) return;

    event = eventStore.add(event, this.relay.url);

    return this.events.addEvent(event);
  }

  private handleDeleteEvent(deleteEvent: NostrEvent) {
    const cord = deleteEvent.tags.find(isATag)?.[1];
    const eventId = deleteEvent.tags.find(isETag)?.[1];

    if (cord) this.events.deleteEvent(cord);
    if (eventId) this.events.deleteEvent(eventId);
  }

  getFirstEvent(nth = 0, eventFilter?: EventFilter) {
    return this.events.getFirstEvent(nth, eventFilter);
  }
  getLastEvent(nth = 0, eventFilter?: EventFilter) {
    return this.events.getLastEvent(nth, eventFilter);
  }

  destroy() {
    for (const sub of this.subs) sub.unsubscribe();
    this.subs = [];
    processManager.unregisterProcess(this.process);
  }
}
