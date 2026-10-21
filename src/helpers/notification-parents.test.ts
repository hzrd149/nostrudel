import { EventStore } from "applesauce-core";
import { EventPointer } from "applesauce-core/helpers";
import { finalizeEvent, getPublicKey, NostrEvent } from "nostr-tools";
import { EMPTY, of, Subject } from "rxjs";
import { afterEach, describe, expect, it, vi } from "vitest";

import { loadNotificationParents, NotificationParentStatus } from "./notification-parents";

const ownKey = new Uint8Array(32).fill(1);
const user = getPublicKey(ownKey);
const sign = (tags: string[][] = [], created_at = 100) =>
  finalizeEvent({ kind: 1, tags, content: "", created_at }, ownKey);
afterEach(() => vi.useRealTimers());

describe("targeted notification parent loading", () => {
  it("loads a missing older parent once across several replies and quotes, and preserves relay hints", () => {
    const store = new EventStore();
    const parent = sign([], 1);
    const events = new Subject<NostrEvent>();
    const response = new Subject<NostrEvent>();
    const load = vi.fn((_pointer: EventPointer) => response);
    const status: NotificationParentStatus[] = [];
    const subscription = loadNotificationParents(events, store, load, vi.fn()).subscribe((value) => status.push(value));
    events.next(
      sign([
        ["p", user],
        ["e", parent.id, "wss://hint.test/", "reply"],
      ]),
    );
    events.next(
      sign(
        [
          ["p", user],
          ["q", parent.id],
        ],
        101,
      ),
    );
    expect(load).toHaveBeenCalledTimes(1);
    expect(load.mock.calls[0][0].relays).toContain("wss://hint.test/");
    expect(status.at(-1)).toEqual({ pending: 1, failed: 0 });
    response.next(parent);
    expect(status.at(-1)).toEqual({ pending: 0, failed: 0 });
    subscription.unsubscribe();
    store.dispose();
  });

  it("skips known parents and explicit author hints", () => {
    const store = new EventStore();
    const parent = sign([], 1);
    store.add(parent);
    const load = vi.fn(() => EMPTY);
    const events = of(sign([["e", parent.id, "", "reply"]]), sign([["e", "a".repeat(64), "", "reply", user]]));
    const subscription = loadNotificationParents(events, store, load, vi.fn()).subscribe();
    expect(load).not.toHaveBeenCalled();
    subscription.unsubscribe();
    store.dispose();
  });

  it("bounds concurrent requests, counts queued parents, and cancels all on unmount", () => {
    const store = new EventStore();
    const events = new Subject<NostrEvent>();
    const requests = Array.from({ length: 6 }, () => new Subject<NostrEvent>());
    const load = vi.fn(() => requests[load.mock.calls.length - 1]);
    const status: NotificationParentStatus[] = [];
    const subscription = loadNotificationParents(events, store, load, vi.fn()).subscribe((value) => status.push(value));
    for (let index = 0; index < 6; index++)
      events.next(sign([["e", index.toString(16).padStart(64, "0"), "", "reply"]], 100 + index));
    expect(load).toHaveBeenCalledTimes(4);
    expect(status.at(-1)?.pending).toBe(6);
    subscription.unsubscribe();
    expect(requests.every((request) => !request.observed)).toBe(true);
    expect(events.observed).toBe(false);
    store.dispose();
  });

  it("marks missing/timed-out parents as incomplete without hanging acquisition", async () => {
    vi.useFakeTimers();
    const store = new EventStore();
    const events = new Subject<NostrEvent>();
    const pending = new Subject<NostrEvent>();
    const status: NotificationParentStatus[] = [];
    const onError = vi.fn();
    const subscription = loadNotificationParents(events, store, () => pending, onError).subscribe((value) =>
      status.push(value),
    );
    events.next(sign([["e", "a".repeat(64), "", "reply"]]));
    await vi.advanceTimersByTimeAsync(15_000);
    expect(status.at(-1)).toEqual({ pending: 0, failed: 1 });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(pending.observed).toBe(false);
    subscription.unsubscribe();
    store.dispose();
  });
});
