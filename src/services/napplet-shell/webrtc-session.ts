/*
 * Adapted from napplet-soy/packages/runtime/src/webrtc-session.ts.
 * MIT License
 *
 * Copyright (c) 2026 napplet.space contributors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */
import type { WebrtcOpenRequest, WebrtcOpenResult, WebrtcEvent } from "@napplet/core";
import { logger } from "../../helpers/debug";
import type { WebrtcSignal, WebrtcSignaling, WebrtcSignalingSession } from "./webrtc-signaling";

const log = logger.extend("napplet-webrtc");
type WithoutSession<T> = T extends unknown ? Omit<T, "sessionId"> : never;
type SessionEvent = WithoutSession<WebrtcEvent>;
type Open = WebrtcOpenRequest & { channel: string };
function parseOpen(input: unknown): Open {
  if (!input || typeof input !== "object") throw new Error("Invalid WebRTC request");
  const { scope, channel = "napplet", protocol } = input as WebrtcOpenRequest;
  const hex = (key: unknown): key is string => typeof key === "string" && /^[a-f0-9]{64}$/.test(key);
  if (!scope || (scope.type !== "direct" && scope.type !== "room")) throw new Error("Invalid WebRTC scope");
  if (scope.type === "direct" && !hex(scope.pubkey)) throw new Error("Invalid peer pubkey");
  if (
    scope.type === "room" &&
    (typeof scope.room !== "string" ||
      !scope.room.length ||
      scope.room.length > 256 ||
      (scope.peers !== undefined && (!Array.isArray(scope.peers) || scope.peers.length > 8 || !scope.peers.every(hex))))
  )
    throw new Error("Invalid WebRTC room");
  if (
    typeof channel !== "string" ||
    !channel.length ||
    channel.length > 64 ||
    (protocol !== undefined && (typeof protocol !== "string" || protocol.length > 128))
  )
    throw new Error("Invalid WebRTC channel or protocol");
  return { scope, channel, protocol };
}

type Peer = {
  pc: RTCPeerConnection;
  channel?: RTCDataChannel;
  connectionId: string;
  chain: Promise<void>;
  answer?: string;
  started: number;
  joined: boolean;
  received: number;
  bytes: number;
  window: number;
  queued: number;
};
type Session = {
  id: string;
  request: Open;
  signaling: WebrtcSignalingSession;
  state: "connecting" | "open" | "closed";
  peers: Map<string, Peer>;
  timer?: ReturnType<typeof setInterval>;
  config: RTCConfiguration;
  sent: number;
  sentBytes: number;
  sendWindow: number;
};

/** NAP-WEBRTC peer connections and data channels with an injected signaling backend. */
export class NappletWebrtc {
  private sessions = new Map<string, Session>();
  private alive = true;
  private permission?: Promise<boolean>;
  private opening = 0;
  constructor(
    private signaling: WebrtcSignaling,
    private send: (message: Record<string, unknown>) => void,
    private consent: () => Promise<boolean>,
    private ice: () => Promise<RTCConfiguration> = async () => ({ iceServers: [] }),
  ) {}
  private event(session: Session, event: SessionEvent) {
    if (this.alive && (this.sessions.has(session.id) || event.type === "closed"))
      this.send({ type: "webrtc.event", event: { ...event, sessionId: session.id } });
  }
  handle(message: { type: "webrtc.open"; request: WebrtcOpenRequest }): Promise<WebrtcOpenResult>;
  handle(message: Record<string, unknown>): Promise<Record<string, unknown>>;
  async handle(message: Record<string, unknown>): Promise<WebrtcOpenResult | Record<string, unknown>> {
    if (message.type === "webrtc.open") return this.open(message.request);
    const id = String(message.sessionId),
      session = this.sessions.get(id);
    if (message.type === "webrtc.close") {
      this.closeSession(id, typeof message.reason === "string" ? message.reason.slice(0, 200) : "closed");
      return {};
    }
    if (!session) throw new Error("WebRTC session unavailable");
    if (message.type !== "webrtc.send") throw new Error("Unsupported WebRTC operation");
    const payload = JSON.stringify(message.payload);
    if (payload === undefined || new TextEncoder().encode(payload).length > 16384)
      throw new Error("WebRTC payload must be JSON and at most 16 KiB");
    const bytes = new TextEncoder().encode(payload).length;
    if (Date.now() - session.sendWindow >= 1000) {
      session.sendWindow = Date.now();
      session.sent = 0;
      session.sentBytes = 0;
    }
    if (++session.sent > 120 || (session.sentBytes += bytes) > 524288) throw new Error("WebRTC send rate exceeded");
    const channels = [...session.peers.values()]
      .map((p) => p.channel)
      .filter((c): c is RTCDataChannel => c?.readyState === "open");
    if (!channels.length) throw new Error("WebRTC is connecting; wait for a peer joined event");
    if (channels.some((c) => c.bufferedAmount + bytes > 262144))
      throw new Error("WebRTC backpressure; skip obsolete frames and retry later");
    for (const channel of channels) channel.send(payload);
    return {};
  }
  private async open(input: unknown): Promise<WebrtcOpenResult> {
    const request = parseOpen(input);
    if (!this.alive || this.sessions.size + this.opening >= 4) throw new Error("WebRTC session limit reached");
    this.opening++;
    try {
      const permission = (this.permission ??= this.consent());
      const allowed = await permission;
      if (this.permission === permission) this.permission = undefined;
      if (!allowed) {
        throw new Error("Peer connection denied");
      }
      if (!this.alive) throw new Error("Player closed");
      const signaling = await this.signaling.open(request);
      let session: Session;
      try {
        if (request.scope.type === "direct" && request.scope.pubkey === signaling.self)
          throw new Error("Cannot connect to yourself");
        const config = await this.ice();
        if (!this.alive) throw new Error("Player closed");
        if ([...this.sessions.values()].some((s) => s.signaling.scopeKey === signaling.scopeKey))
          throw new Error("This WebRTC scope is already open");
        session = {
          id: crypto.randomUUID(),
          request,
          signaling,
          state: "connecting",
          peers: new Map(),
          config,
          sent: 0,
          sentBytes: 0,
          sendWindow: Date.now(),
        };
      } catch (error) {
        signaling.close();
        throw error;
      }
      this.sessions.set(session.id, session);
      // Reply before emitting events; all work is owned by the session's lifecycle.
      setTimeout(() => {
        if (this.sessions.has(session.id))
          void this.start(session).catch(() => this.closeSession(session.id, "Signaling unavailable"));
      }, 0);
      return { session: { id: session.id, ...request, state: session.state } };
    } finally {
      this.opening--;
    }
  }
  private allowed(s: Session, key: string) {
    return (
      key !== s.signaling.self &&
      (s.request.scope.type === "direct"
        ? s.request.scope.pubkey === key
        : !s.request.scope.peers || s.request.scope.peers.includes(key))
    );
  }
  private async start(s: Session) {
    s.signaling.start((signal) => this.receive(s, signal));
    s.timer = setInterval(() => {
      for (const peer of s.peers.values()) {
        if (!peer.joined && Date.now() - peer.started > 45000) {
          this.closeSession(s.id, "Peer connection timed out; retry or check TURN configuration");
          return;
        }
      }
    }, 2000);
  }
  private receive(s: Session, signal: WebrtcSignal) {
    if (!this.sessions.has(s.id) || !this.allowed(s, signal.pubkey)) return;
    const key = signal.pubkey;
    let peer = s.peers.get(key);
    if (signal.type === "peer") {
      if (peer && peer.connectionId !== signal.connectionId) {
        this.removePeer(s, key);
        peer = undefined;
      }
      if (peer || s.peers.size >= 8) return;
      const p = this.peer(s, key, signal.connectionId);
      s.peers.set(key, p);
      if (signal.initiator) {
        p.chain = p.chain
          .then(async () => {
            if (!this.sessions.has(s.id) || s.peers.get(key) !== p) return;
            this.channel(s, key, p, p.pc.createDataChannel(s.request.channel, { ordered: true }));
            await p.pc.setLocalDescription(await p.pc.createOffer());
            await this.gather(p.pc);
            await s.signaling.sendDescription(key, p.connectionId, { type: "offer", sdp: p.pc.localDescription!.sdp });
          })
          .catch(() => this.removePeer(s, key));
      }
      return;
    }
    if (!peer || signal.connectionId !== peer.connectionId) return;
    const p = peer;
    if (p.queued >= 4) return;
    p.queued++;
    p.chain = p.chain
      .then(async () => {
        if (!this.sessions.has(s.id) || s.peers.get(key) !== p) return;
        const description = signal.description;
        if (description.sdp.length > 32000) return;
        if (description.type === "offer") {
          if (!p.answer) {
            await p.pc.setRemoteDescription(description);
            await p.pc.setLocalDescription(await p.pc.createAnswer());
            await this.gather(p.pc);
            p.answer = p.pc.localDescription!.sdp;
          }
          await s.signaling.sendDescription(key, p.connectionId, { type: "answer", sdp: p.answer });
        } else if (description.type === "answer" && !p.pc.remoteDescription) {
          await p.pc.setRemoteDescription(description);
        }
      })
      .catch(() => this.removePeer(s, key))
      .finally(() => {
        p.queued--;
      });
  }
  private peer(s: Session, key: string, connectionId: string): Peer {
    const pc = new RTCPeerConnection(s.config);
    const peer: Peer = {
      pc,
      connectionId,
      chain: Promise.resolve(),
      started: Date.now(),
      joined: false,
      received: 0,
      bytes: 0,
      window: Date.now(),
      queued: 0,
    };
    pc.ondatachannel = (event) => this.channel(s, key, peer, event.channel);
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed")
        this.closeSession(s.id, "Peer connection failed; reopen the session to refresh connectivity");
      else if (pc.connectionState === "closed") this.removePeer(s, key);
    };
    return peer;
  }
  private channel(s: Session, key: string, p: Peer, channel: RTCDataChannel) {
    if (p.channel || channel.label !== s.request.channel) {
      channel.close();
      return;
    }
    p.channel = channel;
    channel.onopen = () => {
      p.joined = true;
      if (s.state !== "open") {
        s.state = "open";
        this.event(s, { type: "state", state: "open" });
      }
      this.event(s, { type: "peer", pubkey: key, state: "joined" });
    };
    channel.onclose = () => this.removePeer(s, key);
    channel.onmessage = (event) => {
      if (typeof event.data !== "string") return;
      if (Date.now() - p.window > 1000) {
        p.window = Date.now();
        p.received = 0;
        p.bytes = 0;
      }
      const bytes = new TextEncoder().encode(event.data).length;
      p.bytes += bytes;
      if (++p.received > 240 || p.bytes > 524288 || bytes > 16384) {
        this.removePeer(s, key);
        return;
      }
      try {
        this.event(s, { type: "message", from: key, payload: JSON.parse(event.data) });
      } catch (error) {
        log("Invalid peer payload", error);
      }
    };
  }
  private gather(pc: RTCPeerConnection) {
    if (pc.iceGatheringState === "complete") return Promise.resolve();
    return new Promise<void>((resolve) => {
      const done = () => {
        clearTimeout(timer);
        pc.removeEventListener("icegatheringstatechange", changed);
        resolve();
      };
      const changed = () => {
        if (pc.iceGatheringState === "complete") done();
      };
      const timer = setTimeout(done, 8000);
      pc.addEventListener("icegatheringstatechange", changed);
    });
  }
  private removePeer(s: Session, key: string) {
    const peer = s.peers.get(key);
    if (!peer) return;
    s.peers.delete(key);
    s.signaling.forgetPeer(key, peer.connectionId);
    peer.pc.onconnectionstatechange = null;
    if (peer.channel) {
      peer.channel.onclose = null;
      peer.channel.close();
    }
    peer.pc.close();
    if (peer.joined) this.event(s, { type: "peer", pubkey: key, state: "left" });
    if (![...s.peers.values()].some((p) => p.joined) && s.state === "open") {
      s.state = "connecting";
      this.event(s, { type: "state", state: "connecting" });
    }
  }
  private closeSession(id: string, reason: string) {
    const session = this.sessions.get(id);
    if (!session) return;
    this.sessions.delete(id);
    clearInterval(session.timer);
    for (const key of session.peers.keys()) this.removePeer(session, key);
    session.signaling.close();
    session.state = "closed";
    this.event(session, { type: "closed", reason });
  }
  close(reason = "Player closed") {
    for (const id of this.sessions.keys()) this.closeSession(id, reason);
    this.alive = false;
    this.signaling.close();
  }
}
