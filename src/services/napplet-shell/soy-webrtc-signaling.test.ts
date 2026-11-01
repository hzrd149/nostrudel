import { finalizeEvent, getPublicKey, nip44, type NostrEvent } from "nostr-tools";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSoyWebrtcSignaling } from "./soy-webrtc-signaling";

vi.mock("./relay-tiers", () => ({ getReadRelays: () => [], getWriteRelays: () => [] }));
vi.mock("../verify-event", async () => ({ default: (await import("nostr-tools")).verifyEvent }));

const localKey = new Uint8Array(32).fill(1);
const peerKey = new Uint8Array(32).fill(2);
const self = getPublicKey(localKey);
const peer = getPublicKey(peerKey);
const conversationKey = nip44.v2.utils.getConversationKey(peerKey, self);

async function setup() {
  let receive!: (event: NostrEvent) => void;
  const published: NostrEvent[] = [];
  const unsubscribe = vi.fn();
  const closePool = vi.fn();
  const backend = createSoyWebrtcSignaling("author:35129:game", {
    signer: {
      getPublicKey: async () => self,
      signEvent: async (event) => finalizeEvent(event, localKey),
      nip44: {
        encrypt: async (_peer, text) => nip44.v2.encrypt(text, conversationKey),
        decrypt: async (_peer, text) => nip44.v2.decrypt(text, conversationKey),
      },
    },
    pool: {
      subscribe: (_filters, callback) => {
        receive = callback;
        return unsubscribe;
      },
      publish: async (event) => {
        published.push(event);
      },
      close: closePool,
    },
  });
  const session = await backend.open({ scope: { type: "direct", pubkey: peer }, channel: "game" });
  const emit = vi.fn();
  session.start(emit);
  await flush();
  const hello = JSON.parse(published[0].content);
  function signal(body: Record<string, unknown>, targeted = false, createdAt = Math.floor(Date.now() / 1000)) {
    const raw = JSON.stringify({ v: "soy-rtc/1", wire: session.scopeKey, nonce: "peer-connection", ...body });
    return finalizeEvent(
      {
        kind: 25050,
        created_at: createdAt,
        tags: [["d", session.scopeKey], ...(targeted ? [["p", self]] : [])],
        content: targeted ? nip44.v2.encrypt(raw, conversationKey) : raw,
      },
      peerKey,
    );
  }
  return {
    backend,
    session,
    emit,
    hello,
    signal,
    deliver: (event: NostrEvent) => receive(event),
    published,
    unsubscribe,
    closePool,
  };
}
async function flush() {
  for (let i = 0; i < 20; i++) await Promise.resolve();
}
afterEach(() => vi.useRealTimers());

describe("soy-rtc/1 signaling adapter", () => {
  it("rejects stale, forged, replayed and incorrectly targeted signals", async () => {
    vi.useFakeTimers();
    const s = await setup();
    s.deliver(s.signal({ type: "hello" }, false, Math.floor(Date.now() / 1000) - 61));
    const forged = JSON.parse(JSON.stringify(s.signal({ type: "hello" })));
    forged.sig = "0".repeat(128);
    s.deliver(forged);
    await flush();
    expect(s.emit).not.toHaveBeenCalled();
    const hello = s.signal({ type: "hello" });
    s.deliver(hello);
    s.deliver(hello);
    await flush();
    expect(s.emit).toHaveBeenCalledTimes(1);
    expect(s.emit).toHaveBeenCalledWith({
      type: "peer",
      pubkey: peer,
      connectionId: "peer-connection",
      initiator: self < peer,
    });
    const type = peer < self ? "offer" : "answer";
    s.deliver(s.signal({ type, to: "old-session", sdp: "bad" }, true));
    s.deliver(s.signal({ type, to: s.hello.nonce, nonce: "old-peer", sdp: "bad" }, true));
    await flush();
    expect(s.emit).toHaveBeenCalledTimes(1);
    s.deliver(s.signal({ type, to: s.hello.nonce, sdp: "valid-sdp" }, true));
    await flush();
    expect(s.emit).toHaveBeenLastCalledWith({
      type: "description",
      pubkey: peer,
      connectionId: "peer-connection",
      description: { type, sdp: "valid-sdp" },
    });
    s.backend.close();
  });

  it("stops retries and in-flight delivery on close and releases the relay pool", async () => {
    vi.useFakeTimers();
    const s = await setup();
    s.deliver(s.signal({ type: "hello" }));
    await flush();
    await s.session.sendDescription(peer, "peer-connection", { type: "offer", sdp: "offer" });
    const sent = s.published.length;
    await vi.advanceTimersByTimeAsync(2000);
    expect(s.published.length).toBeGreaterThan(sent);
    s.backend.close();
    const afterClose = s.published.length;
    const notifications = s.emit.mock.calls.length;
    s.deliver(s.signal({ type: "hello", nonce: "new-peer" }));
    await vi.advanceTimersByTimeAsync(4000);
    expect(s.published).toHaveLength(afterClose);
    expect(s.emit).toHaveBeenCalledTimes(notifications);
    expect(s.unsubscribe).toHaveBeenCalledTimes(1);
    expect(s.closePool).toHaveBeenCalledTimes(1);
    await expect(s.backend.open({ scope: { type: "room", room: "later" }, channel: "game" })).rejects.toThrow("closed");
  });
});
