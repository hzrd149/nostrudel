import { TimelineLoader, TimelineStatus, TimelineWindow } from "applesauce-loaders/loaders";
import { NostrEvent } from "nostr-tools";
import { BehaviorSubject, isObservable, Observable, of, Subject } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createTimelineRange, RANGE_STEP } from "./timeline-range";

const HEAD = 100 * 86400;

function fakeLoader() {
  const status$ = new BehaviorSubject<TimelineStatus[]>([]);
  const events$ = new Subject<NostrEvent>();
  const windows: TimelineWindow[] = [];
  const loader = Object.assign(
    (input: TimelineWindow | Observable<TimelineWindow>) =>
      new Observable<NostrEvent>((observer) => {
        const sub = (isObservable(input) ? input : of(input)).subscribe((window) => windows.push(window));
        sub.add(events$.subscribe(observer));
        return sub;
      }),
    { status$ },
  ) as TimelineLoader;
  return { loader, status$, events$, windows, last: () => windows[windows.length - 1] };
}

const status = (source: string, window: TimelineWindow, state: TimelineStatus["state"]): TimelineStatus => ({
  source,
  filter: {},
  window,
  buffer: window,
  state,
});

const event = (created_at: number, i: number) => ({ id: `${created_at}-${i}`, created_at }) as NostrEvent;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(HEAD * 1000);
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 16));
  vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("timeline range", () => {
  it("commits a window once the first source loads it, without waiting on the others", async () => {
    const { loader, status$, last } = fakeLoader();
    const range = createTimelineRange(loader);
    const sub = range.run().subscribe();
    await vi.advanceTimersByTimeAsync(200);

    const window = last();
    expect(window).toEqual({ since: HEAD - RANGE_STEP, until: HEAD });
    status$.next([status("a", window, "loading"), status("b", window, "loading")]);
    await vi.advanceTimersByTimeAsync(200);
    expect(range.range$.value.since).toBe(HEAD);

    status$.next([status("a", window, "covered"), status("b", window, "loading")]);
    await vi.advanceTimersByTimeAsync(50);
    expect(range.range$.value).toEqual({ since: HEAD - RANGE_STEP, until: HEAD });
    sub.unsubscribe();
  });

  it("commits anyway when no source reports a window loaded in time", async () => {
    const { loader } = fakeLoader();
    const range = createTimelineRange(loader);
    const sub = range.run().subscribe();
    await vi.advanceTimersByTimeAsync(4000);
    expect(range.range$.value.since).toBe(HEAD);

    await vi.advanceTimersByTimeAsync(1100);
    expect(range.range$.value.since).toBe(HEAD - RANGE_STEP);
    sub.unsubscribe();
  });

  it("reaches further after quiet extensions and resets after busy ones", async () => {
    const { loader, status$, events$, last } = fakeLoader();
    const range = createTimelineRange(loader);
    const sub = range.run().subscribe();
    const commit = async () => {
      await vi.advanceTimersByTimeAsync(200);
      status$.next([status("a", last(), "covered")]);
      await vi.advanceTimersByTimeAsync(50);
    };

    // Nothing visible yet, so every commit reaches past the range again
    await commit();
    expect(range.range$.value.since).toBe(HEAD - RANGE_STEP);
    await vi.advanceTimersByTimeAsync(200);
    expect(last().since).toBe(HEAD - 3 * RANGE_STEP);

    for (let i = 0; i < 25; i++) events$.next(event(HEAD - 2 * RANGE_STEP, i));
    await commit();
    expect(range.range$.value.since).toBe(HEAD - 3 * RANGE_STEP);
    await vi.advanceTimersByTimeAsync(200);
    expect(last().since).toBe(HEAD - 4 * RANGE_STEP);
    sub.unsubscribe();
  });

  it("follows the visible notes without reaching while the end of the list is out of view", async () => {
    const { loader, status$, windows, last } = fakeLoader();
    const range = createTimelineRange(loader);
    const sub = range.run().subscribe();
    await vi.advanceTimersByTimeAsync(200);
    status$.next([status("a", last(), "covered")]);
    await vi.advanceTimersByTimeAsync(50);

    range.view$.next({ visibleSince: HEAD - 3600, bottomNear: false });
    await vi.advanceTimersByTimeAsync(200);
    expect(last()).toEqual({ since: HEAD - 3600, until: HEAD });
    const count = windows.length;
    for (let i = 0; i < 20; i++) range.view$.next({ visibleSince: HEAD - 3600, bottomNear: false });
    await vi.advanceTimersByTimeAsync(200);
    expect(windows.length).toBe(count);
    expect(range.range$.value.since).toBe(HEAD - RANGE_STEP);

    range.view$.next({ visibleSince: HEAD - 3600, bottomNear: true });
    await vi.advanceTimersByTimeAsync(200);
    expect(last().since).toBe(HEAD - 3 * RANGE_STEP);
    sub.unsubscribe();
  });

  it("stops loading when unsubscribed", async () => {
    const { loader, events$ } = fakeLoader();
    const sub = createTimelineRange(loader).run().subscribe();
    expect(events$.observed).toBe(true);
    sub.unsubscribe();
    expect(events$.observed).toBe(false);
  });
});
