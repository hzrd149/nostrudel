import { createWebrtcService } from "@kehto/services";
import { type WebrtcEvent } from "@napplet/core";
import { RelayPool, type RelayAuthContext } from "applesauce-relay";
import type { NostrEvent } from "nostr-tools";

import ignoreRelayErrors from "../../helpers/ignore-relay-errors";
import { getReadRelays, getWriteRelays } from "./relay-tiers";
import { getNappletTransportSigner } from "./transport-identity";
import { NappletWebrtc } from "./webrtc-session";

export type NappletWebrtcOptions = {
  resolveIdentity(windowId: string): string | undefined;
  requestConsent(windowId: string): Promise<boolean>;
};

export function createNappletWebrtcService(options: NappletWebrtcOptions) {
  const windows = new Map<string, { backend: NappletWebrtc; pool: RelayPool }>();
  return createWebrtcService({
    open: async (request, context) => {
      if (typeof RTCPeerConnection === "undefined") throw new Error("WebRTC unavailable in this browser");
      const identity = options.resolveIdentity(context.windowId);
      if (!identity) throw new Error("Napplet frame unavailable");
      let entry = windows.get(context.windowId);
      if (!entry) {
        const signer = getNappletTransportSigner(identity);
        // Keep transport connections out of the app pool's account-authentication lifecycle.
        const pool = new RelayPool({ keepAlive: 0 });
        const onAuthRequired = async ({ relay }: RelayAuthContext) => {
          await relay.authenticate(signer);
        };
        const backend = new NappletWebrtc(
          signer,
          identity,
          {
            subscribe: (filters, receive) => {
              const sub = pool
                .subscription(getReadRelays(), filters, { onAuthRequired })
                .pipe(ignoreRelayErrors("Napplet WebRTC signaling"))
                .subscribe((event) => {
                  if (typeof event !== "string") receive(event as NostrEvent);
                });
              return () => sub.unsubscribe();
            },
            publish: async (event) => {
              await pool.publish(getWriteRelays(), event, { onAuthRequired });
            },
          },
          (message) => context.emit(message.event as WebrtcEvent),
          async () => {
            const allowed = await options.requestConsent(context.windowId);
            return allowed && options.resolveIdentity(context.windowId) === identity;
          },
          async () => ({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] }),
        );
        entry = { backend, pool };
        windows.set(context.windowId, entry);
      }
      return entry.backend.handle({ type: "webrtc.open", request });
    },
    send: async (sessionId, payload, context) => {
      const entry = windows.get(context.windowId);
      if (!entry) throw new Error("WebRTC session unavailable");
      await entry.backend.handle({ type: "webrtc.send", sessionId, payload });
    },
    close: async (sessionId, reason, context) => {
      await windows.get(context.windowId)?.backend.handle({ type: "webrtc.close", sessionId, reason });
    },
    destroyWindow: (windowId) => {
      windows.get(windowId)?.backend.close();
      windows.get(windowId)?.pool.close();
      windows.delete(windowId);
    },
  });
}
