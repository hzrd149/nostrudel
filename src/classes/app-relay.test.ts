import { Relay, RelayAuthContext } from "applesauce-relay";
import { finalizeEvent } from "nostr-tools";
import { EMPTY } from "rxjs";
import { afterEach, describe, expect, it, vi } from "vitest";

import AppRelayPool from "./app-relay";

const pool = new AppRelayPool();
const url = "wss://auth.example/";
const event = finalizeEvent({ kind: 1, content: "hello", created_at: 1, tags: [] }, new Uint8Array(32).fill(1));

afterEach(() => {
  pool.close();
  vi.restoreAllMocks();
});

describe("app relay authentication observations", () => {
  it("preserves operation policy and forwards auth context to callers", () => {
    const upstream = vi.spyOn(Relay.prototype, "request").mockReturnValue(EMPTY);
    const relay = pool.relay(url);
    const handler = vi.fn();
    relay.request({ kinds: [1] }, { waitForAuth: "alice", authTimeout: 5000, onAuthRequired: handler });
    const options = upstream.mock.calls[0][1];
    expect(options?.waitForAuth).toBe("alice");
    expect(options?.authTimeout).toBe(5000);
    expect(relay.authRequiredForRead$.value).toBe(false);

    const context: RelayAuthContext = {
      relay,
      url,
      challenge: "challenge",
      reason: "auth-required: private feed",
      request: { verb: "REQ", id: "feed", filters: [{ kinds: [1] }] },
      requirement: "alice",
      missingPubkeys: ["alice"],
    };
    options?.onAuthRequired?.(context);
    expect(handler).toHaveBeenCalledWith(context);
    expect(relay.authRequiredForRead$.value).toBe(true);
    expect(relay.authRequiredForPublish$.value).toBe(false);
  });

  it("tracks publish refusals separately and retains per-account verdicts", () => {
    const upstream = vi.spyOn(Relay.prototype, "publish").mockResolvedValue({ ok: true, from: url });
    const relay = pool.relay(url);
    void relay.publish(event, { waitForAuth: "bob", retries: 2 });
    const options = upstream.mock.calls[0][1];
    expect(options?.retries).toBe(2);
    options?.onAuthRequired?.({
      relay,
      url,
      challenge: "challenge",
      reason: "auth-required: publish",
      request: { verb: "EVENT", event },
      requirement: "bob",
      missingPubkeys: ["bob"],
    });
    expect(relay.authRequiredForPublish$.value).toBe(true);
    expect(relay.authRequiredForRead$.value).toBe(false);

    const authEvent = finalizeEvent({ kind: 22242, content: "", tags: [], created_at: 1 }, new Uint8Array(32).fill(2));
    relay.authentications$.next({
      [authEvent.pubkey]: { event: { ...authEvent, kind: 22242 }, response: { ok: true, from: url } },
    });
    expect(relay.isAuthenticated(authEvent.pubkey)).toBe(true);
    expect(relay.isAuthenticated("bob")).toBe(false);
    expect(pool.relay("wss://auth.example")).toBe(relay);
  });
});
