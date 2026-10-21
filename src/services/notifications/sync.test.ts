import { ReadonlyAccount } from "applesauce-accounts/accounts";
import { finalizeEvent, getPublicKey } from "nostr-tools";
import { Subscription } from "rxjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ sync: vi.fn(), live: vi.fn(), request: vi.fn(), activeLive: 0 }));
vi.mock("../accounts", async () => ({ default: new (await import("applesauce-accounts")).AccountManager() }));
vi.mock("../event-store", async () => ({ eventStore: new (await import("applesauce-core")).EventStore() }));
vi.mock("../preferences", async () => ({
  default: { fallbackRelays: new (await import("rxjs")).BehaviorSubject(["wss://fallback.test/"]) },
}));
vi.mock("../event-cache", async () => {
  const { EMPTY, BehaviorSubject } = await import("rxjs");
  return { cacheRequest: () => EMPTY, eventCache$: new BehaviorSubject(null) };
});
vi.mock("../pool", async () => {
  const { Observable, EMPTY } = await import("rxjs");
  mocks.sync.mockImplementation(() => EMPTY);
  mocks.request.mockImplementation(() => EMPTY);
  mocks.live.mockImplementation(
    () =>
      new Observable(() => {
        mocks.activeLive++;
        return () => {
          mocks.activeLive--;
        };
      }),
  );
  return {
    default: {
      subscription: mocks.live,
      request: mocks.request,
      relay: (url: string) => ({
        getSupported: async () => [77],
        getLimitations: async () => ({ max_limit: 100 }),
        sync: (_store: unknown, filter: unknown) => mocks.sync(url, filter),
        request: mocks.request,
      }),
    },
  };
});

const { default: accounts } = await import("../accounts");
const { eventStore } = await import("../event-store");
const { eventCache$ } = await import("../event-cache");
const { conversationSync$, socialSync$, quoteSync$, repostSync$, zapSync$ } = await import("./sync");
const key = new Uint8Array(32).fill(1);
const user = getPublicKey(key);
let subscriptions: Subscription[];

beforeEach(() => {
  vi.useFakeTimers();
  mocks.sync.mockClear();
  mocks.live.mockClear();
  mocks.request.mockClear();
  subscriptions = [];
});
afterEach(async () => {
  accounts.clearActive();
  subscriptions.forEach((subscription) => subscription.unsubscribe());
  await vi.advanceTimersByTimeAsync(1001);
  for (const event of eventStore.getByFilters({})) eventStore.remove(event);
  vi.useRealTimers();
});

describe("notification acquisition ownership", () => {
  it("shares inbound acquisition across domains without fetching unrelated reply parents or authored history", async () => {
    eventStore.add(
      finalizeEvent(
        {
          kind: 1,
          content: "",
          created_at: 100,
          tags: [
            ["p", user],
            ["e", "a".repeat(64), "", "reply"],
          ],
        },
        new Uint8Array(32).fill(2),
      ),
    );
    accounts.active$.next(ReadonlyAccount.fromPubkey(user));
    subscriptions.push(socialSync$.subscribe(), quoteSync$.subscribe());
    await vi.waitFor(() => expect(mocks.sync).toHaveBeenCalledTimes(1));
    await vi.advanceTimersByTimeAsync(100);
    expect(mocks.sync.mock.calls[0][1].authors).toBeUndefined();
    expect(mocks.request).not.toHaveBeenCalled();
    expect(mocks.activeLive).toBe(1);
  });

  it("shares the social domain across subscribers and uses separate inbox/outbox roles", async () => {
    eventStore.add(
      finalizeEvent(
        {
          kind: 10002,
          content: "",
          created_at: 100,
          tags: [
            ["r", "wss://inbox.test/", "read"],
            ["r", "wss://outbox.test/", "write"],
          ],
        },
        key,
      ),
    );
    accounts.active$.next(ReadonlyAccount.fromPubkey(user));
    subscriptions.push(conversationSync$.subscribe(), conversationSync$.subscribe());
    await vi.waitFor(() => expect(mocks.sync).toHaveBeenCalledTimes(2));
    expect(
      mocks.sync.mock.calls.some(([relay, filter]) => relay === "wss://inbox.test/" && filter["#p"]?.[0] === user),
    ).toBe(true);
    expect(
      mocks.sync.mock.calls.some(([relay, filter]) => relay === "wss://outbox.test/" && filter.authors?.[0] === user),
    ).toBe(true);
    subscriptions.forEach((subscription) => subscription.unsubscribe());
    await vi.advanceTimersByTimeAsync(500);
    subscriptions.push(conversationSync$.subscribe());
    expect(mocks.sync).toHaveBeenCalledTimes(2);
    expect(mocks.activeLive).toBe(2);
  });

  it("cancels old account acquisition immediately and isolates logout", async () => {
    const states: (string | undefined)[] = [];
    accounts.active$.next(ReadonlyAccount.fromPubkey(user));
    subscriptions.push(
      conversationSync$.subscribe((state) => states.push(state ? accounts.active?.pubkey : undefined)),
    );
    await vi.waitFor(() => expect(mocks.sync).toHaveBeenCalledTimes(2));
    const other = getPublicKey(new Uint8Array(32).fill(2));
    accounts.active$.next(ReadonlyAccount.fromPubkey(other));
    await vi.waitFor(() => expect(mocks.sync).toHaveBeenCalledTimes(4));
    expect(mocks.activeLive).toBe(2);
    accounts.clearActive();
    expect(mocks.activeLive).toBe(0);
    expect(states.at(-1)).toBeUndefined();
  });

  it("resets acquisition when the cache backend changes", async () => {
    accounts.active$.next(ReadonlyAccount.fromPubkey(user));
    subscriptions.push(conversationSync$.subscribe());
    await vi.waitFor(() => expect(mocks.sync).toHaveBeenCalledTimes(2));
    eventCache$.next(null);
    await vi.waitFor(() => expect(mocks.sync).toHaveBeenCalledTimes(4));
    expect(mocks.activeLive).toBe(2);
  });

  it("starts only the requested independent notification domain", async () => {
    accounts.active$.next(ReadonlyAccount.fromPubkey(user));
    subscriptions.push(repostSync$.subscribe());
    await vi.waitFor(() => expect(mocks.sync).toHaveBeenCalledTimes(1));
    expect(mocks.sync.mock.calls[0][1].kinds).toEqual([6, 16]);
    subscriptions.push(zapSync$.subscribe());
    await vi.waitFor(() => expect(mocks.sync).toHaveBeenCalledTimes(2));
    expect(mocks.sync.mock.calls[1][1].kinds).toEqual([9735]);
  });
});
