import { Subject } from "rxjs";
import { NostrEvent } from "../types/nostr-event";
import { NostrQuery } from "../types/nostr-query";
import { NostrRequest } from "./nostr-request";

function mergeSets<T extends unknown>(to: Set<T>, from: Iterable<T>) {
  for (const el of from) {
    to.add(el);
  }
}

export type getQueryKeyFn<QueryT> = (query: QueryT) => string;
export type mergeQueriesFn<QueryT> = (a: QueryT, b: QueryT) => QueryT | undefined | null;
export type getEventQueryKeyFn = (event: NostrEvent) => string;

type PendingRequest<QueryT = NostrQuery> = {
  query: QueryT;
  subject: Subject<NostrEvent>;
  relays: Set<string>;
};

/** @deprecated incomplete */
export class RequestManager<QueryT extends NostrQuery> {
  private getQueryKey: getQueryKeyFn<QueryT>;
  private mergeQueries: mergeQueriesFn<QueryT>;
  private getEventQueryKey: getEventQueryKeyFn;

  private runningRequests = new Map<string, NostrRequest>();
  private requestQueue = new Map<string, PendingRequest<QueryT>>();

  constructor(
    getQueryKey: getQueryKeyFn<QueryT>,
    mergeQueries: mergeQueriesFn<QueryT>,
    getEventQueryKey: getEventQueryKeyFn
  ) {
    this.getQueryKey = getQueryKey;
    this.mergeQueries = mergeQueries;
    this.getEventQueryKey = getEventQueryKey;
  }

  request(query: QueryT, relays: string[]) {
    const key = this.getQueryKey(query);
    if (this.runningRequests.has(key)) throw new Error("requesting a currently running query");

    const pending = this.requestQueue.get(key);
    if (pending) {
      mergeSets(pending.relays, relays);
      return pending.subject;
    }

    const subject = new Subject<NostrEvent>();
    this.requestQueue.set(key, {
      query,
      relays: new Set(relays),
      subject,
    });

    return subject;
  }

  batch() {
    const requests: PendingRequest<QueryT>[] = [];

    for (const [key, pending] of this.requestQueue) {
      let wasMerged = false;
      if (requests.length > 0) {
        for (const request of requests) {
          const merged = this.mergeQueries(request.query, pending.query);
          if (merged) {
            request.query = merged;
            request.subject.subscribe(pending.subject);
            mergeSets(request.relays, pending.relays);
            wasMerged = true;
            break;
          }
        }
      }

      // if there are no requests. or pending failed to merge create new request
      if (!wasMerged) {
        const subject = new Subject<NostrEvent>();
        subject.subscribe(pending.subject);
        requests.push({ query: pending.query, subject, relays: pending.relays });
      }
    }

    for (const request of requests) {
      const r = new NostrRequest(Array.from(request.relays));
      r.onEvent.subscribe(request.subject);
      r.start(request.query);
    }
  }
}
