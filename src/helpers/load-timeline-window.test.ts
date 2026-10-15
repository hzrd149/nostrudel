import { createTimelineLoader } from "applesauce-loaders/loaders";
import { finalizeEvent, NostrEvent } from "nostr-tools";
import { Observable, Subject, of } from "rxjs";
import { describe, expect, it, vi } from "vitest";

import { loadTimelineWindow } from "./load-timeline-window";

function event(created_at: number): NostrEvent {
  return finalizeEvent({ kind: 1, content: "", tags: [], created_at }, new Uint8Array(32).fill(1));
}

describe("timeline window ownership", () => {
  it("catches up to a sparse visible cursor and then stops requesting history", () => {
    const request = vi.fn((_relays, filters) => of(event((filters[0].until ?? 1000) - 10)));
    const loader = createTimelineLoader(request, ["wss://example.com"], { kinds: [1] });
    const cursor$ = new Subject<number>();
    const subscription = loadTimelineWindow(loader, cursor$).subscribe();
    cursor$.next(-Infinity);
    for (let tick = 0; tick < 60; tick++) cursor$.next(950);
    expect(request).toHaveBeenCalledTimes(5);
    subscription.unsubscribe();
  });

  it("skips idle requests after catching up and loads when the cursor moves older", () => {
    const request = vi.fn((_relays, filters) => of(event((filters[0].until ?? 1000) - 10)));
    const loader = createTimelineLoader(request, ["wss://example.com"], { kinds: [1] });
    const cursor$ = new Subject<number>();
    const subscription = loadTimelineWindow(loader, cursor$).subscribe();
    cursor$.next(-Infinity);
    for (let tick = 0; tick < 60; tick++) cursor$.next(990);
    expect(request).toHaveBeenCalledTimes(1);
    cursor$.next(950);
    expect(request).toHaveBeenCalledTimes(2);
    subscription.unsubscribe();
    cursor$.next(900);
    expect(request).toHaveBeenCalledTimes(2);
  });

  it("retains in-flight requests across ticks and cancels them when the owner leaves", () => {
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
    const loader = createTimelineLoader(request, ["wss://example.com"], { kinds: [1] });
    const cursor$ = new Subject<number>();
    const next = vi.fn();
    const subscription = loadTimelineWindow(loader, cursor$).subscribe(next);
    cursor$.next(-Infinity);
    for (let tick = 0; tick < 60; tick++) cursor$.next(900);
    expect(request).toHaveBeenCalledTimes(1);
    expect(cancel).not.toHaveBeenCalled();
    pending.next(event(990));
    expect(next).toHaveBeenCalledTimes(1);
    subscription.unsubscribe();
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(cursor$.observed).toBe(false);
  });
});
