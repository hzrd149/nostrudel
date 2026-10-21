import { EventStore } from "applesauce-core";
import { createSyncLoader, SyncResult } from "applesauce-loaders/loaders";
import { finalizeEvent, Filter, NostrEvent } from "nostr-tools";
import { BehaviorSubject, EMPTY, NEVER, Observable, of, Subject, switchMap, throwError } from "rxjs";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createNotificationSync, NotificationSyncState } from "./notification-sync";

const RELAY = "wss://one.example/";
const SECOND_RELAY = "wss://two.example/";

function event(created_at: number, content = "mention") {
  return finalizeEvent({ kind: 1, content, tags: [], created_at }, new Uint8Array(32).fill(1));
}

function setup() {
  vi.spyOn(Date, "now").mockReturnValue(1_000_000);
  const eventStore = new EventStore();
  const relays$ = new BehaviorSubject([RELAY]);
  const live = new Subject<NostrEvent>();
  const request = vi.fn((_relay: string, _filters: Filter[]) => EMPTY as Observable<NostrEvent>);
  const sync = vi.fn((_relay: string, _filter: Filter) => EMPTY as Observable<SyncResult>);
  const getSupported = vi.fn(async () => [77]);
  const syncLoader = vi.fn(createSyncLoader({ eventStore, request, sync, getSupported }));
  const cacheRequest = vi.fn((_filters: Filter[]) => EMPTY as Observable<NostrEvent>);
  const subscribeLive = vi.fn((_relays: string[], _filter: Filter) => live.asObservable());
  const onError = vi.fn();
  const options = {
    filter: { kinds: [1] },
    relays$,
    window: { since: 900, until: 1000 },
    eventStore,
    syncLoader,
    cacheRequest,
    subscribeLive,
    onError,
  };
  const states: NotificationSyncState[] = [];
  const source = createNotificationSync(options);
  return {
    eventStore,
    relays$,
    live,
    request,
    sync,
    getSupported,
    syncLoader,
    cacheRequest,
    subscribeLive,
    onError,
    options,
    source,
    states,
  };
}

afterEach(() => vi.restoreAllMocks());

describe("notification sync acquisition", () => {
  it("subscribes live before hydrating, hydrates before reconciling, and shares one run", async () => {
    const context = setup();
    const cache = new Subject<NostrEvent>();
    const cached = event(950);
    context.cacheRequest.mockImplementation(() => {
      expect(context.live.observed).toBe(true);
      return cache;
    });
    context.sync.mockImplementation(() => {
      expect(context.eventStore.hasEvent(cached.id)).toBe(true);
      return EMPTY;
    });
    const first = context.source.subscribe((state) => context.states.push(state));
    const second = context.source.subscribe();
    expect(context.cacheRequest).toHaveBeenCalledTimes(1);
    expect(context.syncLoader).not.toHaveBeenCalled();
    cache.next(cached);
    cache.complete();
    await vi.waitFor(() => expect(context.states.at(-1)?.done).toBe(true));
    expect(context.syncLoader).toHaveBeenCalledTimes(1);
    expect(context.subscribeLive).toHaveBeenCalledTimes(1);
    first.unsubscribe();
    expect(context.live.observed).toBe(true);
    second.unsubscribe();
    expect(context.live.observed).toBe(false);
    expect(context.relays$.observed).toBe(false);
  });

  it("adds relays without restarting history or rehydrating and ignores equivalent lists", async () => {
    const context = setup();
    const subscription = context.source.subscribe((state) => context.states.push(state));
    await vi.waitFor(() => expect(context.states.at(-1)?.done).toBe(true));
    context.relays$.next([RELAY, RELAY]);
    expect(context.subscribeLive).toHaveBeenCalledTimes(1);
    context.relays$.next([SECOND_RELAY, RELAY]);
    await vi.waitFor(() => expect(context.sync).toHaveBeenCalledTimes(2));
    context.relays$.next([RELAY, SECOND_RELAY]);
    expect(context.sync).toHaveBeenCalledTimes(2);
    expect(context.syncLoader).toHaveBeenCalledTimes(1);
    expect(context.cacheRequest).toHaveBeenCalledTimes(1);
    expect(context.subscribeLive).toHaveBeenCalledTimes(2);
    subscription.unsubscribe();
  });

  it("retains events arriving during hydration and deduplicates history/live overlap", async () => {
    const context = setup();
    const cache = new Subject<NostrEvent>();
    const incoming = event(1000);
    const accepted: NostrEvent[] = [];
    const additions = context.eventStore.insert$.subscribe((value) => accepted.push(value));
    context.cacheRequest.mockReturnValue(cache);
    context.sync.mockReturnValue(of({ type: "received", from: RELAY, event: incoming }));
    const subscription = context.source.subscribe((state) => context.states.push(state));
    expect(context.subscribeLive.mock.calls[0][1]).toEqual({ kinds: [1], since: 1000 });
    context.live.next(incoming);
    expect(context.eventStore.hasEvent(incoming.id)).toBe(true);
    cache.complete();
    await vi.waitFor(() => expect(context.states.at(-1)?.done).toBe(true));
    expect(accepted.map((value) => value.id)).toEqual([incoming.id]);
    subscription.unsubscribe();
    additions.unsubscribe();
  });

  it("removes in-flight relays without cancelling the remaining relay", async () => {
    const context = setup();
    const active = new Set<string>();
    context.relays$.next([RELAY, SECOND_RELAY]);
    context.sync.mockImplementation(
      (relay) =>
        new Observable(() => {
          active.add(relay);
          return () => {
            active.delete(relay);
          };
        }),
    );
    const subscription = context.source.subscribe();
    await vi.waitFor(() => expect(active.size).toBe(2));
    context.relays$.next([RELAY]);
    expect([...active]).toEqual([RELAY]);
    expect(context.sync).toHaveBeenCalledTimes(2);
    subscription.unsubscribe();
    expect(active.size).toBe(0);
  });

  it("removes history bounds from live subscriptions", () => {
    const context = setup();
    const subscription = createNotificationSync({
      ...context.options,
      filter: { kinds: [1], since: 900, until: 1000, limit: 100 },
    }).subscribe();
    expect(context.subscribeLive.mock.calls[0][1]).toEqual({ kinds: [1], since: 1000 });
    subscription.unsubscribe();
  });

  it("loads only older disjoint windows and leaves completed history running for new relays", async () => {
    const context = setup();
    const subscription = context.source.subscribe((state) => context.states.push(state));
    await vi.waitFor(() => expect(context.states.at(-1)?.done).toBe(true));
    const loadMore = context.states.at(-1)!.loadMore;
    loadMore();
    loadMore();
    expect(context.syncLoader).toHaveBeenCalledTimes(2);
    await vi.waitFor(() => expect(context.states.at(-1)?.done).toBe(true));
    expect(context.syncLoader.mock.calls.map(([request]) => request.filter)).toEqual([
      { kinds: [1], since: 900, until: 1000 },
      { kinds: [1], since: 800, until: 899 },
    ]);
    expect(context.subscribeLive).toHaveBeenCalledTimes(1);
    context.relays$.next([RELAY, SECOND_RELAY]);
    await vi.waitFor(() => expect(context.sync).toHaveBeenCalledTimes(4));
    subscription.unsubscribe();
  });

  it("continues with network sync after a cache error and reports degraded cache state", async () => {
    const context = setup();
    const error = new Error("cache unavailable");
    context.cacheRequest.mockReturnValue(throwError(() => error));
    const subscription = context.source.subscribe((state) => context.states.push(state));
    await vi.waitFor(() => expect(context.states.at(-1)?.done).toBe(true));
    expect(context.states.at(-1)?.windows[0].cacheError).toBe(error);
    expect(context.onError).toHaveBeenCalledWith(error);
    expect(context.sync).toHaveBeenCalledTimes(1);
    subscription.unsubscribe();
  });

  it("extends a requested range without restarting an in-flight window", async () => {
    const context = setup();
    const pending = new Subject<SyncResult>();
    context.sync.mockReturnValue(pending);
    const subscription = context.source.subscribe((state) => context.states.push(state));
    await vi.waitFor(() => expect(context.sync).toHaveBeenCalledTimes(1));
    context.states.at(-1)!.ensureSince(700);
    context.states.at(-1)!.ensureSince(700);
    await vi.waitFor(() => expect(context.sync).toHaveBeenCalledTimes(2));
    expect(pending.observers).toHaveLength(2);
    expect(context.syncLoader.mock.calls.map(([request]) => request.filter)).toEqual([
      { kinds: [1], since: 900, until: 1000 },
      { kinds: [1], since: 700, until: 899 },
    ]);
    pending.complete();
    await vi.waitFor(() => expect(context.states.at(-1)?.done).toBe(true));
    subscription.unsubscribe();
  });

  it("retries failed windows and live acquisition without retaining the old run", async () => {
    const context = setup();
    context.sync.mockReturnValue(throwError(() => new Error("offline")));
    context.request.mockReturnValue(throwError(() => new Error("offline")));
    const subscription = context.source.subscribe((state) => context.states.push(state));
    await vi.waitFor(() => expect(context.states.at(-1)?.failedRelays).toHaveLength(1));
    context.sync.mockReturnValue(EMPTY);
    context.states.at(-1)!.retry();
    await vi.waitFor(() => {
      expect(context.states.at(-1)?.failedRelays).toHaveLength(0);
      expect(context.states.at(-1)?.done).toBe(true);
    });
    expect(context.syncLoader).toHaveBeenCalledTimes(2);
    expect(context.subscribeLive).toHaveBeenCalledTimes(2);
    expect(context.states.at(-1)?.done).toBe(true);
    subscription.unsubscribe();
  });

  it("surfaces authentication failures without treating them as successful or trying a REQ fallback", async () => {
    const context = setup();
    const error = new Error("authentication required");
    error.name = "AuthRequiredError";
    context.sync.mockReturnValue(throwError(() => error));
    const subscription = context.source.subscribe((state) => context.states.push(state));
    await vi.waitFor(() => expect(context.states.at(-1)?.done).toBe(true));
    expect(context.request).not.toHaveBeenCalled();
    expect(context.states.at(-1)?.failedRelays).toEqual([RELAY]);
    subscription.unsubscribe();
  });

  it("falls back to paginated requests and reports relay failure separately from completion", async () => {
    const context = setup();
    const error = new Error("sync failed");
    context.sync.mockReturnValue(throwError(() => error));
    context.request.mockReturnValue(throwError(() => new Error("request failed")));
    const subscription = context.source.subscribe((state) => context.states.push(state));
    await vi.waitFor(() => expect(context.states.at(-1)?.done).toBe(true));
    expect(context.request).toHaveBeenCalledTimes(1);
    expect(context.states.at(-1)?.failedRelays).toEqual([RELAY]);
    const relay = context.states.at(-1)?.windows[0].status?.relays[RELAY];
    expect(relay?.fallbackReason?.message).toBe("sync failed");
    expect(relay?.method).toBe("request");
    subscription.unsubscribe();
  });

  it("records sync timing and uses paginated requests on REQ-only relays", async () => {
    const context = setup();
    context.getSupported.mockResolvedValue([]);
    const received = event(950);
    context.request.mockImplementation((_relay, filters) => of(...(filters[0].until === 1000 ? [received] : [])));
    const subscription = context.source.subscribe((state) => context.states.push(state));
    await vi.waitFor(() => expect(context.states.at(-1)?.done).toBe(true));
    expect(context.sync).not.toHaveBeenCalled();
    expect(context.request).toHaveBeenCalledTimes(2);
    expect(context.eventStore.hasEvent(received.id)).toBe(true);
    expect(context.states.at(-1)?.windows[0]).toMatchObject({ cacheMs: 0, firstEventMs: 0, elapsedMs: 0 });
    subscription.unsubscribe();
  });

  it("reports live errors while allowing historical sync to finish", async () => {
    const context = setup();
    const subscription = context.source.subscribe((state) => context.states.push(state));
    const error = new Error("live failed");
    context.live.error(error);
    await vi.waitFor(() => expect(context.states.at(-1)?.done).toBe(true));
    expect(context.states.at(-1)?.liveError).toBe(error);
    expect(context.onError).toHaveBeenCalledWith(error);
    subscription.unsubscribe();
  });

  it("cancels hydration and live subscriptions on account change or logout", () => {
    const context = setup();
    const cache = new Subject<NostrEvent>();
    context.cacheRequest.mockReturnValue(cache);
    const accounts$ = new BehaviorSubject<string | undefined>("first");
    const subscription = accounts$
      .pipe(
        switchMap((pubkey) =>
          pubkey
            ? createNotificationSync({
                ...context.options,
                filter: { kinds: [1], "#p": [pubkey] },
              })
            : NEVER,
        ),
      )
      .subscribe();
    expect(cache.observed).toBe(true);
    accounts$.next("second");
    expect(context.subscribeLive.mock.calls.map(([, filter]) => filter["#p"])).toEqual([["first"], ["second"]]);
    accounts$.next(undefined);
    expect(cache.observed).toBe(false);
    expect(context.live.observed).toBe(false);
    cache.complete();
    expect(context.syncLoader).not.toHaveBeenCalled();
    subscription.unsubscribe();
  });
});
