import { afterEach, describe, expect, it, vi } from "vitest";
import { createNappletWebrtcService } from "../webrtc-service";

const mocks = vi.hoisted(() => ({
  store: new Map<string, string>(),
  publish: vi.fn(async (_relays: string[], _event: import("nostr-tools").NostrEvent) => [{ ok: true }]),
  poolClose: vi.fn(),
  account: { pubkey: "a".repeat(64), nip44: { encrypt: vi.fn(), decrypt: vi.fn() }, signEvent: vi.fn() },
}));
vi.mock("../../accounts", async () => {
  const { BehaviorSubject } = await import("rxjs");
  const active$ = new BehaviorSubject(mocks.account);
  return {
    default: {
      active$,
      get active() {
        return active$.value;
      },
    },
  };
});
vi.mock("../../pool", () => {
  throw new Error("WebRTC must not use the account relay pool");
});
vi.mock("localforage", () => ({
  default: {
    createInstance: () => ({
      getItem: async (key: string) => mocks.store.get(key) ?? null,
      setItem: async (key: string, value: string) => {
        mocks.store.set(key, value);
      },
    }),
  },
}));
vi.mock("applesauce-relay", async () => {
  const { NEVER } = await import("rxjs");
  return {
    RelayPool: class {
      subscription = () => NEVER;
      publish = mocks.publish;
      close = mocks.poolClose;
    },
  };
});
vi.mock("../relay-tiers", () => ({ getReadRelays: () => [], getWriteRelays: () => [] }));
vi.mock("../../verify-event", async () => ({ default: (await import("nostr-tools")).verifyEvent }));

import accounts from "../../accounts";

afterEach(() => {
  vi.unstubAllGlobals();
  accounts.active$.next(mocks.account as unknown as typeof accounts.active);
});

async function result(
  service: ReturnType<typeof createNappletWebrtcService>,
  windowId: string,
  message: Record<string, unknown>,
) {
  const sent: Record<string, any>[] = [];
  service.handleMessage(windowId, message as never, (message) => {
    sent.push(message);
  });
  for (let i = 0; i < 25; i++) await Promise.resolve();
  return sent;
}
describe("NAP-WEBRTC service", () => {
  it("correlates results, isolates frame sessions and destroys pending connections", async () => {
    vi.stubGlobal("RTCPeerConnection", class {});
    const service = createNappletWebrtcService({
      resolveIdentity: () => "author:35129:game",
      requestConsent: async () => true,
    });
    const response = await result(service, "frame-a", {
      type: "webrtc.open",
      id: "open-1",
      request: { scope: { type: "room", room: "game" } },
    });
    expect(response[0]).toMatchObject({
      type: "webrtc.open.result",
      id: "open-1",
      session: { state: "connecting", channel: "napplet" },
    });
    const sessionId = response[0].session.id;
    const wrongFrame = await result(service, "frame-b", { type: "webrtc.send", id: "send-1", sessionId, payload: {} });
    expect(wrongFrame[0]).toMatchObject({ id: "send-1", error: expect.stringContaining("unavailable") });
    service.onWindowDestroyed?.("frame-a");
    const afterClose = await result(service, "frame-a", { type: "webrtc.send", id: "send-2", sessionId, payload: {} });
    expect(afterClose[0]).toMatchObject({ id: "send-2", error: expect.stringContaining("unavailable") });
  });

  it("signals locally while signed out and keeps sessions alive across account changes", async () => {
    vi.stubGlobal("RTCPeerConnection", class {});
    const service = createNappletWebrtcService({
      resolveIdentity: () => "author:35129:game",
      requestConsent: async () => true,
    });
    accounts.active$.next(undefined);
    const sent = await result(service, "frame-a", {
      type: "webrtc.open",
      id: "open",
      request: { scope: { type: "room", room: "game" } },
    });
    expect(sent[0]).toMatchObject({ type: "webrtc.open.result", session: { state: "connecting" } });
    accounts.active$.next(mocks.account as unknown as typeof accounts.active);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(sent).toHaveLength(1);
    expect(mocks.publish).toHaveBeenCalled();
    const event = mocks.publish.mock.calls.at(-1)![1];
    expect(event.pubkey).not.toBe(mocks.account.pubkey);
    expect(mocks.account.signEvent).not.toHaveBeenCalled();
    expect(mocks.account.nip44.encrypt).not.toHaveBeenCalled();
    service.onWindowDestroyed?.("frame-a");
    expect(mocks.poolClose).toHaveBeenCalled();
  });
});
