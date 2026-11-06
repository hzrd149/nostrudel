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
import type { WebrtcOpenRequest } from "@napplet/core";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex } from "@noble/hashes/utils.js";
import { RelayPool, type RelayAuthContext } from "applesauce-relay";
import type { Filter, NostrEvent } from "nostr-tools";

import { logger } from "../../helpers/debug";
import verifyEvent from "../verify-event";
import { getReadRelays, getWriteRelays } from "./relay-tiers";
import { getNappletTransportSigner, type NappletTransportSigner } from "./transport-identity";
import type { WebrtcSignal, WebrtcSignaling, WebrtcSignalingSession } from "./webrtc-signaling";

const log = logger.extend("soy-webrtc-signaling");
export type SignalingPool = {
  subscribe(filters: Filter[], receive: (event: NostrEvent) => void, onError: (error: unknown) => void): () => void;
  publish(event: NostrEvent): Promise<void>;
  close?(): void;
};

function createPool(signer: NappletTransportSigner): SignalingPool {
  // Separate connections avoid the app pool's account-authentication lifecycle.
  const pool = new RelayPool({ keepAlive: 0 });
  const onAuthRequired = async ({ relay }: RelayAuthContext) => {
    await relay.authenticate(signer);
  };
  return {
    subscribe: (filters, receive, onError) => {
      const sub = pool.subscription(getReadRelays(), filters, { onAuthRequired }).subscribe({
        next: (event) => {
          if (typeof event !== "string") receive(event as NostrEvent);
        },
        error: onError,
        complete: () => onError(new Error("Signaling subscription closed")),
      });
      return () => sub.unsubscribe();
    },
    publish: async (event) => {
      const results = await pool.publish(getWriteRelays(), event, { onAuthRequired });
      if (!results.some((result) => result.ok)) throw new Error("No signaling relay accepted the event");
    },
    close: () => pool.close(),
  };
}

/** Nostr kind 25050 discovery and NIP-44 SDP exchange using Soy's soy-rtc/1 profile. */
export function createSoyWebrtcSignaling(
  identity: string,
  options: { signer?: NappletTransportSigner; pool?: SignalingPool } = {},
): WebrtcSignaling {
  const signer = options.signer ?? getNappletTransportSigner(identity);
  const pool = options.pool ?? createPool(signer);
  const sessions = new Set<WebrtcSignalingSession>();
  let alive = true;
  return {
    open: async (request) => {
      if (!alive) throw new Error("Signaling closed");
      const self = await signer.getPublicKey();
      if (!alive) throw new Error("Signaling closed");
      const scope =
        request.scope.type === "room"
          ? ["room", request.scope.room]
          : ["direct", ...[self, request.scope.pubkey].sort()];
      const wire = bytesToHex(
        sha256(
          new TextEncoder().encode(
            JSON.stringify(["soy-rtc/1", identity, scope, request.channel, request.protocol ?? ""]),
          ),
        ),
      );
      const session = createSession(request, self, wire, signer, pool, () => sessions.delete(session));
      sessions.add(session);
      return session;
    },
    close: () => {
      if (!alive) return;
      alive = false;
      for (const session of sessions) session.close();
      pool.close?.();
    },
  };
}

function createSession(
  request: WebrtcOpenRequest,
  self: string,
  wire: string,
  signer: NappletTransportSigner,
  pool: SignalingPool,
  onClose: () => void,
): WebrtcSignalingSession {
  const nonce = crypto.randomUUID();
  const seen = new Set<string>();
  const peers = new Map<string, string>();
  const offers = new Map<string, { to: string; sdp: string }>();
  let alive = true;
  let started = false;
  let timer: ReturnType<typeof setInterval> | undefined;
  let unsubscribe: (() => void) | undefined;
  let signals = 0;
  let signalWindow = Date.now();

  let notify: ((signal: WebrtcSignal) => void) | undefined;
  const close = () => {
    if (!alive) return;
    alive = false;
    clearInterval(timer);
    unsubscribe?.();
    offers.clear();
    peers.clear();
    onClose();
  };
  const fail = (error: unknown) => {
    if (!alive) return;
    log("Signaling unavailable", error);
    close();
    notify?.({ type: "closed", reason: "Signaling unavailable" });
  };
  const allowed = (key: string) =>
    key !== self &&
    (request.scope.type === "direct"
      ? request.scope.pubkey === key
      : !request.scope.peers || request.scope.peers.includes(key));
  const publish = async (message: Record<string, unknown>, recipient?: string) => {
    if (!alive) return;
    const raw = JSON.stringify({ v: "soy-rtc/1", wire, nonce, ...message });
    const content = recipient ? await signer.nip44.encrypt(recipient, raw) : raw;
    if (!alive) return;
    const now = Math.floor(Date.now() / 1000);
    const event = await signer.signEvent({
      kind: 25050,
      created_at: now,
      tags: [["d", wire], ...(recipient ? [["p", recipient]] : []), ["expiration", String(now + 60)]],
      content,
    });
    if (alive) await pool.publish(event);
  };
  const hello = () => {
    void publish({ type: "hello" }).catch(fail);
  };
  const receive = async (event: NostrEvent, emit: (signal: WebrtcSignal) => void) => {
    if (Date.now() - signalWindow >= 1000) {
      signalWindow = Date.now();
      signals = 0;
    }
    if (
      ++signals > 32 ||
      !alive ||
      event.kind !== 25050 ||
      !event.tags.some((tag) => tag[0] === "d" && tag[1] === wire) ||
      !allowed(event.pubkey) ||
      event.content.length > 64000 ||
      Math.abs(Date.now() / 1000 - event.created_at) > 60 ||
      seen.has(event.id) ||
      !verifyEvent(event)
    )
      return;
    const expiration = event.tags.find((tag) => tag[0] === "expiration")?.[1];
    if (!expiration || !/^\d+$/.test(expiration) || Number(expiration) <= Date.now() / 1000) return;
    if (seen.size >= 2048) seen.delete(seen.values().next().value!);
    seen.add(event.id);
    const recipient = event.tags.find((tag) => tag[0] === "p")?.[1];
    if (recipient && recipient !== self) return;
    const body = JSON.parse(recipient ? await signer.nip44.decrypt(event.pubkey, event.content) : event.content);
    if (
      !alive ||
      !body ||
      typeof body !== "object" ||
      Array.isArray(body) ||
      body.v !== "soy-rtc/1" ||
      body.wire !== wire ||
      typeof body.nonce !== "string" ||
      !body.nonce.length ||
      body.nonce.length > 64
    )
      return;
    if (!recipient) {
      if (body.type !== "hello" || peers.get(event.pubkey) === body.nonce) return;
      if (!peers.has(event.pubkey) && peers.size >= 8) return;
      peers.set(event.pubkey, body.nonce);
      offers.delete(event.pubkey);
      emit({ type: "peer", pubkey: event.pubkey, connectionId: body.nonce, initiator: self < event.pubkey });
      hello();
      return;
    }
    if (
      body.to !== nonce ||
      peers.get(event.pubkey) !== body.nonce ||
      typeof body.sdp !== "string" ||
      !body.sdp.length ||
      body.sdp.length > 32000
    )
      return;
    if ((body.type === "offer" && event.pubkey < self) || (body.type === "answer" && self < event.pubkey)) {
      if (body.type === "answer") offers.delete(event.pubkey);
      emit({
        type: "description",
        pubkey: event.pubkey,
        connectionId: body.nonce,
        description: { type: body.type, sdp: body.sdp },
      });
    }
  };
  return {
    self,
    scopeKey: wire,
    start: (emit) => {
      if (!alive || started) return;
      started = true;
      notify = emit;
      const stop = pool.subscribe(
        [{ kinds: [25050], "#d": [wire], since: Math.floor(Date.now() / 1000) - 10 }],
        (event) => {
          void receive(event, emit).catch((error) => log("Rejected signal", error));
        },
        fail,
      );
      if (!alive) {
        stop();
        return;
      }
      unsubscribe = stop;
      hello();
      timer = setInterval(() => {
        hello();
        for (const [key, offer] of offers) void publish({ type: "offer", ...offer }, key).catch(fail);
      }, 2000);
    },
    sendDescription: async (pubkey, connectionId, description) => {
      if (!alive || peers.get(pubkey) !== connectionId) return;
      if (description.type === "offer") offers.set(pubkey, { to: connectionId, sdp: description.sdp });
      await publish({ type: description.type, to: connectionId, sdp: description.sdp }, pubkey);
    },
    forgetPeer: (pubkey, connectionId) => {
      if (peers.get(pubkey) !== connectionId) return;
      peers.delete(pubkey);
      offers.delete(pubkey);
    },
    close,
  };
}
