import { finalizeEvent, getPublicKey, nip44, type NostrEvent, type Filter } from "nostr-tools";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NappletWebrtc } from "../webrtc-session";
import { createSoyWebrtcSignaling } from "../soy-webrtc-signaling";
import type { WebrtcSignal, WebrtcSignalingSession } from "../webrtc-signaling";
import type { NappletTransportSigner } from "../transport-identity";

vi.mock("../relay-tiers", () => ({ getReadRelays: () => [], getWriteRelays: () => [] }));
vi.mock("../../verify-event", async () => ({ default: (await import("nostr-tools")).verifyEvent }));

function signer(n: number): NappletTransportSigner {
  const secret = new Uint8Array(32).fill(n);
  return {
    getPublicKey: async () => getPublicKey(secret),
    signEvent: async (event) => finalizeEvent(event, secret),
    nip44: {
      encrypt: async (peer, text) => nip44.v2.encrypt(text, nip44.v2.utils.getConversationKey(secret, peer)),
      decrypt: async (peer, text) => nip44.v2.decrypt(text, nip44.v2.utils.getConversationKey(secret, peer)),
    },
  };
}

class FakeChannel {
  label: string;
  readyState = "open";
  bufferedAmount = 0;
  onopen?: () => void;
  onclose?: () => void;
  onmessage?: (event: { data: string }) => void;
  send = vi.fn();
  close = vi.fn(() => {
    this.readyState = "closed";
  });
  constructor(label: string) {
    this.label = label;
  }
}

class FakePeer {
  static all: FakePeer[] = [];
  iceGatheringState = "complete";
  connectionState = "connecting";
  localDescription?: RTCSessionDescriptionInit;
  remoteDescription?: RTCSessionDescriptionInit;
  ondatachannel?: (event: { channel: FakeChannel }) => void;
  onconnectionstatechange?: () => void;
  channel?: FakeChannel;
  constructor() {
    FakePeer.all.push(this);
  }
  createDataChannel(label: string) {
    return (this.channel = new FakeChannel(label));
  }
  async createOffer() {
    return { type: "offer", sdp: "private-offer-with-ice" };
  }
  async createAnswer() {
    return { type: "answer", sdp: "private-answer-with-ice" };
  }
  async setLocalDescription(description: RTCSessionDescriptionInit) {
    this.localDescription = description;
  }
  async setRemoteDescription(description: RTCSessionDescriptionInit) {
    this.remoteDescription = description;
  }
  close = vi.fn();
}

const backends: NappletWebrtc[] = [];
const receivers = new Set<{ filters: Filter[]; receive: (event: NostrEvent) => void }>();
let published: NostrEvent[];
function setup(n = 1, identity = "author:35129:game", consent = async () => true) {
  const key = signer(n);
  const emit = vi.fn();
  const backend = new NappletWebrtc(
    createSoyWebrtcSignaling(identity, {
      signer: key,
      pool: {
        subscribe: (filters, receive) => {
          const sub = { filters, receive };
          receivers.add(sub);
          return () => {
            receivers.delete(sub);
          };
        },
        publish: async (event) => {
          published.push(event);
          for (const sub of receivers) {
            if (sub.filters[0]["#d"]?.includes(event.tags.find((tag) => tag[0] === "d")![1])) sub.receive(event);
          }
        },
      },
    }),
    emit,
    consent,
  );
  backends.push(backend);
  return { backend, key, emit };
}
async function flush() {
  for (let i = 0; i < 30; i++) await Promise.resolve();
}
async function open(backend: NappletWebrtc, scope: unknown = { type: "room", room: "random-room" }) {
  const result = await backend.handle({ type: "webrtc.open", request: { scope, channel: "game", protocol: "v1" } });
  return result.session as { id: string; state: string };
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("RTCPeerConnection", FakePeer);
  FakePeer.all = [];
  published = [];
});
afterEach(() => {
  backends.splice(0).forEach((backend) => backend.close());
  receivers.clear();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("replaceable signaling", () => {
  it("negotiates through an alternate backend and releases its sessions and peer state", async () => {
    const peer = "b".repeat(64);
    let receive!: (signal: WebrtcSignal) => void;
    const signalingSession: WebrtcSignalingSession = {
      self: "a".repeat(64),
      scopeKey: "alternate-room",
      start: vi.fn((callback) => {
        receive = callback;
      }),
      sendDescription: vi.fn(async () => {}),
      forgetPeer: vi.fn(),
      close: vi.fn(),
    };
    const signaling = { open: vi.fn(async () => signalingSession), close: vi.fn() };
    const emit = vi.fn();
    const backend = new NappletWebrtc(signaling, emit, async () => true);
    backends.push(backend);
    const session = await open(backend);
    expect(signaling.open).toHaveBeenCalledWith({
      scope: { type: "room", room: "random-room" },
      channel: "game",
      protocol: "v1",
    });
    expect(signalingSession.start).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    receive({ type: "peer", pubkey: peer, connectionId: "alternate-connection", initiator: true });
    await flush();
    expect(signalingSession.sendDescription).toHaveBeenCalledWith(peer, "alternate-connection", {
      type: "offer",
      sdp: "private-offer-with-ice",
    });
    receive({
      type: "description",
      pubkey: peer,
      connectionId: "alternate-connection",
      description: { type: "answer", sdp: "alternate-answer" },
    });
    await flush();
    expect(FakePeer.all[0].remoteDescription?.sdp).toBe("alternate-answer");
    const oldChannel = FakePeer.all[0].channel!;
    const oldOpen = oldChannel.onopen!;
    const oldMessage = oldChannel.onmessage!;
    const oldClose = oldChannel.onclose!;
    const oldDataChannel = FakePeer.all[0].ondatachannel!;
    receive({ type: "peer", pubkey: peer, connectionId: "replacement", initiator: true });
    await flush();
    const notifications = emit.mock.calls.length;
    oldOpen();
    oldMessage({ data: JSON.stringify({ stale: true }) });
    oldClose();
    const lateChannel = new FakeChannel("game");
    oldDataChannel({ channel: lateChannel });
    expect(lateChannel.close).toHaveBeenCalled();
    expect(emit).toHaveBeenCalledTimes(notifications);
    expect(FakePeer.all[1].close).not.toHaveBeenCalled();
    receive({ type: "closed", reason: "Relay disconnected" });
    expect(emit).toHaveBeenLastCalledWith({
      type: "webrtc.event",
      event: { type: "closed", sessionId: session.id, reason: "Relay disconnected" },
    });
    expect(signalingSession.close).toHaveBeenCalled();
    expect(signalingSession.forgetPeer).toHaveBeenCalledWith(peer, "alternate-connection");
    receive({ type: "peer", pubkey: "c".repeat(64), connectionId: "late", initiator: true });
    expect(FakePeer.all).toHaveLength(2);
    backend.close();
    expect(signaling.close).toHaveBeenCalled();
    expect(published).toHaveLength(0);
  });
});

describe("soy-rtc/1 host sessions", () => {
  it("negotiates using signed hellos and encrypted offers and answers, then carries JSON only over the data channel", async () => {
    const a = setup(1),
      b = setup(2);
    const sessionA = await open(a.backend),
      sessionB = await open(b.backend);
    expect(sessionA.state).toBe("connecting");
    expect(a.emit).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await flush();
    const offers = published.filter((event) => event.tags.some((tag) => tag[0] === "p"));
    expect(offers).toHaveLength(2);
    for (const event of offers) {
      expect(event.kind).toBe(25050);
      expect(event.content).not.toContain("private-");
      const recipient = event.tags.find((tag) => tag[0] === "p")![1];
      const receiver = recipient === (await a.key.getPublicKey()) ? a.key : b.key;
      const body = JSON.parse(await receiver.nip44.decrypt(event.pubkey, event.content));
      expect(["offer", "answer"]).toContain(body.type);
      expect(body.to).toBeTruthy();
      expect(body.sdp).toContain("private-");
    }
    expect(FakePeer.all).toHaveLength(2);
    const offering = FakePeer.all.find((peer) => peer.channel)!;
    const answering = FakePeer.all.find((peer) => !peer.channel)!;
    const remote = new FakeChannel("game");
    answering.ondatachannel!({ channel: remote });
    offering.channel!.onopen!();
    remote.onopen!();
    const before = published.length;
    await a.backend.handle({ type: "webrtc.send", sessionId: sessionA.id, payload: { move: "left" } });
    expect(published).toHaveLength(before);
    expect(
      [...FakePeer.all.map((peer) => peer.channel), remote]
        .filter(Boolean)
        .some((channel) => channel!.send.mock.calls.length),
    ).toBe(true);
    remote.onmessage!({ data: JSON.stringify({ tick: 7 }) });
    expect([...a.emit.mock.calls, ...b.emit.mock.calls].some(([message]) => message.event?.payload?.tick === 7)).toBe(
      true,
    );
    expect(JSON.stringify([...a.emit.mock.calls, ...b.emit.mock.calls])).not.toContain("private-");
    a.backend.close();
    b.backend.close();
    expect(receivers.size).toBe(0);
    expect(offering.close).toHaveBeenCalled();
    expect(answering.close).toHaveBeenCalled();
    await expect(a.backend.handle({ type: "webrtc.send", sessionId: sessionB.id, payload: "x" })).rejects.toThrow(
      "unavailable",
    );
  });

  it("does not signal without consent or resurrect a closed frame after consent", async () => {
    const denied = setup(1, undefined, async () => false);
    await expect(open(denied.backend)).rejects.toThrow("denied");
    let allow!: (value: boolean) => void;
    const pending = setup(
      2,
      undefined,
      () =>
        new Promise((resolve) => {
          allow = resolve;
        }),
    );
    const result = open(pending.backend);
    pending.backend.close();
    allow(true);
    await expect(result).rejects.toThrow("closed");
    await vi.advanceTimersByTimeAsync(10);
    expect(published).toHaveLength(0);
  });

  it("isolates apps and honors peer allowlists", async () => {
    const a = setup(1),
      b = setup(2),
      otherApp = setup(3, "other:35129:game");
    await open(a.backend, { type: "room", room: "random-room", peers: [] });
    await open(b.backend, { type: "room", room: "random-room", peers: [] });
    await open(otherApp.backend);
    await vi.advanceTimersByTimeAsync(1);
    await flush();
    expect(FakePeer.all).toHaveLength(0);
    expect(published.filter((event) => event.tags.some((tag) => tag[0] === "p"))).toHaveLength(0);
  });

  it("rejects unsupported request fields before consent and limits repeated opens", async () => {
    const consent = vi.fn(async () => true);
    const { backend } = setup(1, undefined, consent);
    await expect(
      backend.handle({ type: "webrtc.open", request: { scope: { type: "room", room: "game" }, iceServers: [] } }),
    ).rejects.toThrow("request");
    await expect(open(backend, { type: "room", room: "game", relays: [] })).rejects.toThrow("room");
    expect(consent).not.toHaveBeenCalled();
    for (let i = 0; i < 8; i++) {
      const session = await open(backend);
      await expect(backend.handle({ type: "webrtc.close", sessionId: session.id, reason: {} })).rejects.toThrow(
        "reason",
      );
      await backend.handle({ type: "webrtc.close", sessionId: session.id });
    }
    await expect(open(backend)).rejects.toThrow("rate");
    await vi.advanceTimersByTimeAsync(10000);
    const session = await open(backend);
    expect(session.state).toBe("connecting");
    await expect(backend.handle({ type: "webrtc.send", sessionId: {}, payload: {} })).rejects.toThrow("session id");
  });

  it("rejects malformed requests, duplicate scopes, excess sessions and oversized payloads", async () => {
    const { backend } = setup();
    await expect(open(backend, { type: "direct", pubkey: "bad" })).rejects.toThrow("pubkey");
    const session = await open(backend);
    await expect(open(backend)).rejects.toThrow("already open");
    for (let i = 0; i < 3; i++) await open(backend, { type: "room", room: String(i) });
    await expect(open(backend, { type: "room", room: "fifth" })).rejects.toThrow("limit");
    await expect(
      backend.handle({ type: "webrtc.send", sessionId: session.id, payload: "x".repeat(16384) }),
    ).rejects.toThrow("16 KiB");
    await expect(backend.handle({ type: "webrtc.send", sessionId: "other-frame", payload: "x" })).rejects.toThrow(
      "unavailable",
    );
  });
});
