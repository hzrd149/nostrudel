import { createTimelineLoader } from "applesauce-loaders/loaders";
import { Filter, finalizeEvent, NostrEvent } from "nostr-tools";
import { Observable, Subject, of } from "rxjs";
import { afterEach, describe, expect, it, vi } from "vitest";

import { loadMoreTimeline, loadTimelineWindow } from "./load-timeline-window";

afterEach(() => vi.restoreAllMocks());

describe("timeline window ownership", () => {
  it("uses finite windows and avoids repeat requests for an unchanged visible cursor", async () => {
    vi.spyOn(Date, "now").mockReturnValue(10 * 86400 * 1000);
    const request = vi.fn((_relays: unknown, filters: Filter[]) => {
      const created_at = Math.max(1, (filters[0].until ?? 0) - 43200);
      return of(finalizeEvent({ kind: 1, content: "", tags: [], created_at }, new Uint8Array(32).fill(1)));
    });
    const loader = createTimelineLoader(request, ["wss://example.com"], { kinds: [1] }, { prefetch: 0 });
    const cursor$ = new Subject<number>();
    const subscription = loadTimelineWindow(loader, cursor$).subscribe();
    await vi.waitFor(() => expect(request.mock.calls.length).toBeGreaterThan(0));
    const initialCalls = request.mock.calls.length;
    cursor$.next(-Infinity);
    for (let tick = 0; tick < 60; tick++) cursor$.next(9.75 * 86400);
    expect(request).toHaveBeenCalledTimes(initialCalls);
    cursor$.next(7.1 * 86400);
    await vi.waitFor(() => expect(request.mock.calls.length).toBeGreaterThan(initialCalls));
    const expandedCalls = request.mock.calls.length;
    expect(expandedCalls).toBeGreaterThan(initialCalls);
    for (let tick = 0; tick < 60; tick++) cursor$.next(7.1 * 86400);
    expect(request).toHaveBeenCalledTimes(expandedCalls);
    loadMoreTimeline(loader);
    await vi.waitFor(() => expect(request.mock.calls.length).toBeGreaterThan(expandedCalls));
    subscription.unsubscribe();
    expect(cursor$.observed).toBe(false);
  });

  it("retains in-flight requests across ticks and cancels them when the owner leaves", async () => {
    const pending = new Subject<NostrEvent>();
    const cancel = vi.fn();
    const request = vi.fn(
      () =>
        new Observable<NostrEvent>((observer) => {
          const subscription = pending.subscribe(observer);
          return () => {
            subscription.unsubscribe();
            cancel();
          };
        }),
    );
    const loader = createTimelineLoader(request, ["wss://example.com"], { kinds: [1] }, { prefetch: 0 });
    const cursor$ = new Subject<number>();
    const subscription = loadTimelineWindow(loader, cursor$).subscribe();
    cursor$.next(-Infinity);
    for (let tick = 0; tick < 60; tick++) cursor$.next(Math.floor(Date.now() / 1000));
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    expect(cancel).not.toHaveBeenCalled();
    subscription.unsubscribe();
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(cursor$.observed).toBe(false);
  });
});
