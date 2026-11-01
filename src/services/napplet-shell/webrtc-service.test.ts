import { afterEach, describe, expect, it, vi } from "vitest";
import { createNappletWebrtcService } from "./webrtc-service";

const mocks = vi.hoisted(() => ({
  account: { pubkey: "a".repeat(64), nip44: { encrypt: vi.fn(), decrypt: vi.fn() }, signEvent: vi.fn() },
}));
vi.mock("../accounts", async () => {
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
vi.mock("../pool", async () => {
  const { EMPTY } = await import("rxjs");
  return { default: { subscription: () => EMPTY, publish: vi.fn() } };
});
vi.mock("./relay-tiers", () => ({ getReadRelays: () => [], getWriteRelays: () => [] }));
vi.mock("../verify-event", async () => ({ default: (await import("nostr-tools")).verifyEvent }));

import accounts from "../accounts";

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

  it("closes existing sessions when the active account changes", async () => {
    vi.stubGlobal("RTCPeerConnection", class {});
    const service = createNappletWebrtcService({
      resolveIdentity: () => "author:35129:game",
      requestConsent: async () => true,
    });
    const sent = await result(service, "frame-a", {
      type: "webrtc.open",
      id: "open",
      request: { scope: { type: "room", room: "game" } },
    });
    accounts.active$.next(undefined);
    expect(sent.at(-1)).toMatchObject({ type: "webrtc.event", event: { type: "closed", reason: "Account changed" } });
    service.onWindowDestroyed?.("frame-a");
  });
});
